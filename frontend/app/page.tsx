"use client";

import {
  Add01Icon,
  ArrowReloadHorizontalIcon,
  Copy01Icon,
  DeliveryBox01Icon,
  EyeIcon,
  Logout03Icon,
  PencilEdit02Icon,
  ReplayIcon,
  Settings02Icon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ActionButton } from "@/components/action-button";
import { LabeledInput } from "@/components/labeled-input";
import { ProtectedScreen } from "@/components/protected-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient, backendUrl } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  createIngestEndpoint,
  createWebhookSubscription,
  getDashboardSummary,
  listInboundEvents,
  listIngestEndpoints,
  listWebhookDeliveries,
  listWebhookDeliveryAttempts,
  listWebhookSubscriptions,
  reprocessInboundEvent,
  retryWebhookDelivery,
  retryWebhookSubscription,
  updateIngestEndpoint,
  updateWebhookSubscription,
  type DashboardSummary,
  type InboundEvent,
  type IngestEndpoint,
  type TrafficScope,
  type WebhookDelivery,
  type WebhookDeliveryAttempt,
  type WebhookSubscription,
} from "@/lib/webhook-api";

type DashboardData = {
  summary: DashboardSummary;
  ingestEndpoints: IngestEndpoint[];
  inboundEvents: InboundEvent[];
  webhookDeliveries: WebhookDelivery[];
  webhookDeliveryAttempts: Record<string, WebhookDeliveryAttempt[]>;
  webhookSubscriptions: WebhookSubscription[];
};

type UiMessage = {
  kind: "error" | "success";
  text: string;
} | null;

type EndpointFormState = {
  mode: "create" | "edit";
  id: string | null;
  name: string;
  uniqueIdentifier: string;
  description: string;
  isActive: boolean;
};

type SubscriptionFormState = {
  mode: "create" | "edit";
  id: string | null;
  ingestEndpointId: string;
  targetUrl: string;
  description: string;
  isActive: boolean;
};

type DetailSelection =
  | {
      kind: "endpoint";
      id: string;
    }
  | {
      kind: "event";
      id: string;
    }
  | {
      kind: "delivery";
      id: string;
    }
  | {
      kind: "subscription";
      id: string;
    }
  | null;

type EndpointStats = {
  activeSubscriptionCount: number;
  deliveryCount: number;
  failedDeliveryCount: number;
  inboundEventCount: number;
  lastInboundEventAt: string | null;
};

type SubscriptionStats = {
  deliveryCount: number;
  failedDeliveryCount: number;
  lastDeliveryAt: string | null;
};

type EventStats = {
  deliveryCount: number;
  failedDeliveryCount: number;
};

const emptySummary: DashboardSummary = {
  activeIngestEndpoints: 0,
  failedDeliveries: 0,
  inboundEventsLast24Hours: 0,
  pendingOrRetryableDeliveries: 0,
  totalIngestEndpoints: 0,
  webhookDeliveriesLast24Hours: 0,
};

const emptyDashboardData: DashboardData = {
  summary: emptySummary,
  ingestEndpoints: [],
  inboundEvents: [],
  webhookDeliveries: [],
  webhookDeliveryAttempts: {},
  webhookSubscriptions: [],
};

const trafficScopes = [
  { label: "My traffic", value: "mine" },
  { label: "All traffic", value: "all" },
] satisfies {
  label: string;
  value: TrafficScope;
}[];

const summaryItems = [
  {
    key: "totalIngestEndpoints",
    label: "Total ingest endpoints",
  },
  {
    key: "activeIngestEndpoints",
    label: "Active ingest endpoints",
  },
  {
    key: "inboundEventsLast24Hours",
    label: "Inbound events, 24h",
  },
  {
    key: "webhookDeliveriesLast24Hours",
    label: "Deliveries, 24h",
  },
  {
    key: "failedDeliveries",
    label: "Failed deliveries",
  },
  {
    key: "pendingOrRetryableDeliveries",
    label: "Pending or retryable",
  },
] satisfies {
  key: keyof DashboardSummary;
  label: string;
}[];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Request failed.";
};

const toNullableText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const shortId = (id: string): string => {
  return id.length <= 12 ? id : `${id.slice(0, 8)}...${id.slice(-4)}`;
};

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const stringifyPreview = (value: unknown, maxLength = 120): string => {
  const text =
    typeof value === "string"
      ? value
      : (() => {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        })();

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const statusBadgeClass = (status: string): string => {
  if (status === "succeeded" || status === "accepted" || status === "active") {
    return "bg-primary text-primary-foreground";
  }

  if (status === "failed" || status === "inactive") {
    return "bg-destructive/10 text-destructive dark:bg-destructive/20";
  }

  return "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200";
};

const MessageBanner = ({ message }: { message: UiMessage }) => {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        message.kind === "success"
          ? "border-primary/20 bg-primary/5 text-primary"
          : "border-destructive/20 bg-destructive/5 text-destructive",
      )}
    >
      {message.text}
    </p>
  );
};

const tableHeaderClass =
  "border-b bg-muted/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground";
const tableCellClass = "border-b px-3 py-2 align-middle";

const Home = () => {
  return (
    <ProtectedScreen>
      {(session) => (
        <Dashboard userEmail={session.user.email} userId={session.user.id} />
      )}
    </ProtectedScreen>
  );
};

const Dashboard = ({
  userEmail,
  userId,
}: {
  userEmail: string;
  userId: string;
}) => {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(emptyDashboardData);
  const [trafficScope, setTrafficScope] = useState<TrafficScope>("mine");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<UiMessage>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [endpointForm, setEndpointForm] = useState<EndpointFormState | null>(null);
  const [subscriptionForm, setSubscriptionForm] =
    useState<SubscriptionFormState | null>(null);
  const [detailSelection, setDetailSelection] = useState<DetailSelection>(null);
  const canManageTraffic = trafficScope === "mine";

  const endpointById = useMemo(() => {
    return new Map(data.ingestEndpoints.map((endpoint) => [endpoint.id, endpoint]));
  }, [data.ingestEndpoints]);

  const eventById = useMemo(() => {
    return new Map(data.inboundEvents.map((event) => [event.id, event]));
  }, [data.inboundEvents]);

  const subscriptionById = useMemo(() => {
    return new Map(
      data.webhookSubscriptions.map((subscription) => [subscription.id, subscription]),
    );
  }, [data.webhookSubscriptions]);

  const endpointStats = useMemo(() => {
    return data.ingestEndpoints.reduce<Record<string, EndpointStats>>(
      (stats, endpoint) => {
        const endpointEvents = data.inboundEvents.filter(
          (event) => event.ingestEndpointId === endpoint.id,
        );
        const endpointSubscriptions = data.webhookSubscriptions.filter(
          (subscription) => subscription.ingestEndpointId === endpoint.id,
        );
        const endpointDeliveries = data.webhookDeliveries.filter((delivery) => {
          const event = eventById.get(delivery.inboundEventId);
          return event?.ingestEndpointId === endpoint.id;
        });

        stats[endpoint.id] = {
          activeSubscriptionCount: endpointSubscriptions.filter(
            (subscription) => subscription.isActive,
          ).length,
          deliveryCount: endpointDeliveries.length,
          failedDeliveryCount: endpointDeliveries.filter(
            (delivery) => delivery.status === "failed",
          ).length,
          inboundEventCount: endpointEvents.length,
          lastInboundEventAt: endpointEvents[0]?.receivedAt ?? null,
        };

        return stats;
      },
      {},
    );
  }, [
    data.ingestEndpoints,
    data.inboundEvents,
    data.webhookDeliveries,
    data.webhookSubscriptions,
    eventById,
  ]);

  const eventStats = useMemo(() => {
    return data.inboundEvents.reduce<Record<string, EventStats>>((stats, event) => {
      const eventDeliveries = data.webhookDeliveries.filter(
        (delivery) => delivery.inboundEventId === event.id,
      );

      stats[event.id] = {
        deliveryCount: eventDeliveries.length,
        failedDeliveryCount: eventDeliveries.filter(
          (delivery) => delivery.status === "failed",
        ).length,
      };

      return stats;
    }, {});
  }, [data.inboundEvents, data.webhookDeliveries]);

  const subscriptionStats = useMemo(() => {
    return data.webhookSubscriptions.reduce<Record<string, SubscriptionStats>>(
      (stats, subscription) => {
        const subscriptionDeliveries = data.webhookDeliveries.filter(
          (delivery) => delivery.webhookSubscriptionId === subscription.id,
        );

        stats[subscription.id] = {
          deliveryCount: subscriptionDeliveries.length,
          failedDeliveryCount: subscriptionDeliveries.filter(
            (delivery) => delivery.status === "failed",
          ).length,
          lastDeliveryAt:
            subscriptionDeliveries[0]?.updatedAt ??
            subscriptionDeliveries[0]?.createdAt ??
            null,
        };

        return stats;
      },
      {},
    );
  }, [data.webhookDeliveries, data.webhookSubscriptions]);

  const latestEventByEndpointId = useMemo(() => {
    return data.inboundEvents.reduce<Record<string, InboundEvent>>((latest, event) => {
      const current = latest[event.ingestEndpointId];

      if (!current || current.receivedAt < event.receivedAt) {
        latest[event.ingestEndpointId] = event;
      }

      return latest;
    }, {});
  }, [data.inboundEvents]);

  const selectedDetail = useMemo(() => {
    if (!detailSelection) {
      return null;
    }

    if (detailSelection.kind === "endpoint") {
      const endpoint = endpointById.get(detailSelection.id);
      return endpoint
        ? {
            title: `Ingest endpoint ${shortId(endpoint.id)}`,
            value: endpoint,
          }
        : null;
    }

    if (detailSelection.kind === "event") {
      const event = eventById.get(detailSelection.id);
      return event
        ? {
            title: `Inbound event ${shortId(event.id)}`,
            value: event,
          }
        : null;
    }

    if (detailSelection.kind === "subscription") {
      const subscription = subscriptionById.get(detailSelection.id);
      return subscription
        ? {
            title: `Webhook subscription ${shortId(subscription.id)}`,
            value: subscription,
          }
        : null;
    }

    const delivery = data.webhookDeliveries.find(
      (item) => item.id === detailSelection.id,
    );

    if (!delivery) {
      return null;
    }

    return {
      title: `Webhook delivery ${shortId(delivery.id)}`,
      value: {
        ...delivery,
        attempts: data.webhookDeliveryAttempts[delivery.id] ?? [],
      },
    };
  }, [
    data.webhookDeliveries,
    data.webhookDeliveryAttempts,
    detailSelection,
    endpointById,
    eventById,
    subscriptionById,
  ]);

  const loadDashboard = useCallback(async (showInitialLoader = false) => {
    if (showInitialLoader) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [
        summaryResponse,
        endpointsResponse,
        subscriptionsResponse,
        eventsResponse,
        deliveriesResponse,
      ] = await Promise.all([
        getDashboardSummary(trafficScope),
        listIngestEndpoints(trafficScope),
        listWebhookSubscriptions(trafficScope),
        listInboundEvents(trafficScope),
        listWebhookDeliveries(trafficScope),
      ]);

      const attemptsEntries = await Promise.all(
        deliveriesResponse.webhookDeliveries.map(async (delivery) => {
          const attemptsResponse = await listWebhookDeliveryAttempts(
            delivery.id,
            trafficScope,
          );
          return [delivery.id, attemptsResponse.webhookDeliveryAttempts] as const;
        }),
      );

      setData({
        summary: summaryResponse.summary,
        ingestEndpoints: endpointsResponse.ingestEndpoints,
        inboundEvents: eventsResponse.inboundEvents,
        webhookDeliveries: deliveriesResponse.webhookDeliveries,
        webhookDeliveryAttempts: Object.fromEntries(attemptsEntries),
        webhookSubscriptions: subscriptionsResponse.webhookSubscriptions,
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [trafficScope]);

  useEffect(() => {
    void loadDashboard(true);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDashboard(false);
      }
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  useEffect(() => {
    setEndpointForm(null);
    setSubscriptionForm(null);
    setDetailSelection(null);
  }, [trafficScope]);

  const runAction = async ({
    action,
    key,
    successText,
  }: {
    action: () => Promise<unknown>;
    key: string;
    successText: string;
  }) => {
    setPendingAction(key);
    setMessage(null);

    try {
      await action();
      setMessage({ kind: "success", text: successText });
      await loadDashboard(false);
    } catch (error) {
      setMessage({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    setMessage(null);
    const result = await authClient.signOut();

    if (result.error) {
      setMessage({
        kind: "error",
        text: result.error.message ?? "Sign out failed.",
      });
      return;
    }

    router.replace("/login");
  };

  const handleEndpointSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!endpointForm) {
      return;
    }

    await runAction({
      action: async () => {
        if (endpointForm.mode === "create") {
          await createIngestEndpoint({
            description: toNullableText(endpointForm.description),
            name: endpointForm.name.trim(),
            uniqueIdentifier:
              endpointForm.uniqueIdentifier.trim() || undefined,
          });
          return;
        }

        if (!endpointForm.id) {
          throw new Error("Endpoint id is missing.");
        }

        await updateIngestEndpoint(endpointForm.id, {
          description: toNullableText(endpointForm.description),
          isActive: endpointForm.isActive,
          name: endpointForm.name.trim(),
        });
      },
      key: "endpoint-form",
      successText:
        endpointForm.mode === "create"
          ? "Ingest endpoint created."
          : "Ingest endpoint updated.",
    });
    setEndpointForm(null);
  };

  const handleSubscriptionSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!subscriptionForm) {
      return;
    }

    await runAction({
      action: async () => {
        if (subscriptionForm.mode === "create") {
          await createWebhookSubscription(subscriptionForm.ingestEndpointId, {
            description: toNullableText(subscriptionForm.description),
            isActive: subscriptionForm.isActive,
            targetUrl: subscriptionForm.targetUrl.trim(),
          });
          return;
        }

        if (!subscriptionForm.id) {
          throw new Error("Subscription id is missing.");
        }

        await updateWebhookSubscription(subscriptionForm.id, {
          description: toNullableText(subscriptionForm.description),
          isActive: subscriptionForm.isActive,
          targetUrl: subscriptionForm.targetUrl.trim(),
        });
      },
      key: "subscription-form",
      successText:
        subscriptionForm.mode === "create"
          ? "Webhook subscription created."
          : "Webhook subscription updated.",
    });
    setSubscriptionForm(null);
  };

  const startCreateEndpoint = () => {
    setEndpointForm({
      description: "",
      id: null,
      isActive: true,
      mode: "create",
      name: "",
      uniqueIdentifier: "",
    });
  };

  const startEditEndpoint = (endpoint: IngestEndpoint) => {
    setEndpointForm({
      description: endpoint.description ?? "",
      id: endpoint.id,
      isActive: endpoint.isActive,
      mode: "edit",
      name: endpoint.name,
      uniqueIdentifier: "",
    });
  };

  const startCreateSubscription = () => {
    setSubscriptionForm({
      description: "",
      id: null,
      ingestEndpointId: data.ingestEndpoints[0]?.id ?? "",
      isActive: true,
      mode: "create",
      targetUrl: "",
    });
  };

  const startEditSubscription = (subscription: WebhookSubscription) => {
    setSubscriptionForm({
      description: subscription.description ?? "",
      id: subscription.id,
      ingestEndpointId: subscription.ingestEndpointId,
      isActive: subscription.isActive,
      mode: "edit",
      targetUrl: subscription.targetUrl,
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-1">
            <h1 className="font-heading text-2xl font-medium tracking-normal">
              Webhook Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {userEmail} · Backend {backendUrl}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link className="gap-2" href="/settings/account">
                <HugeiconsIcon aria-hidden icon={Settings02Icon} size={16} />
                Account
              </Link>
            </Button>
            <ActionButton
              disabled={isRefreshing}
              icon={ArrowReloadHorizontalIcon}
              label="Refresh dashboard"
              onClick={() => loadDashboard(false)}
            >
              {isRefreshing ? "Refreshing" : "Refresh"}
            </ActionButton>
            <ActionButton icon={Logout03Icon} label="Sign out" onClick={handleSignOut}>
              Sign out
            </ActionButton>
          </nav>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div
            aria-label="Traffic scope"
            className="inline-flex rounded-full border bg-muted/30 p-1"
            role="tablist"
          >
            {trafficScopes.map((scope) => (
              <Button
                aria-selected={trafficScope === scope.value}
                key={scope.value}
                onClick={() => setTrafficScope(scope.value)}
                role="tab"
                size="sm"
                type="button"
                variant={trafficScope === scope.value ? "default" : "ghost"}
              >
                {scope.label}
              </Button>
            ))}
          </div>
          {trafficScope === "all" ? (
            <Badge variant="outline">Read-only cross-user view</Badge>
          ) : null}
        </section>

        <MessageBanner message={message} />

        {loadError ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        {isInitialLoading ? (
          <section className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Loading dashboard activity.
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {summaryItems.map((item) => (
                <Card className="rounded-lg py-4" key={item.key} size="sm">
                  <CardContent className="grid gap-1 px-4">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-heading text-2xl font-medium">
                      {data.summary[item.key]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-3">
              <SectionHeader
                action={canManageTraffic ? (
                  <ActionButton
                    icon={Add01Icon}
                    label="Add ingest endpoint"
                    onClick={startCreateEndpoint}
                  />
                ) : undefined}
                icon={<HugeiconsIcon aria-hidden icon={WebhookIcon} size={16} />}
                title="Ingest Endpoints"
              />

              {endpointForm && canManageTraffic ? (
                <EndpointForm
                  form={endpointForm}
                  isSubmitting={pendingAction === "endpoint-form"}
                  onCancel={() => setEndpointForm(null)}
                  onChange={setEndpointForm}
                  onSubmit={handleEndpointSubmit}
                />
              ) : null}

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[72rem] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Name</th>
                      <th className={tableHeaderClass}>Public ingest URL</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Inbound</th>
                      <th className={tableHeaderClass}>Deliveries</th>
                      <th className={tableHeaderClass}>Failed</th>
                      <th className={tableHeaderClass}>Active subs</th>
                      <th className={tableHeaderClass}>Last inbound</th>
                      <th className={tableHeaderClass}>Created</th>
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ingestEndpoints.length === 0 ? (
                      <EmptyRow colSpan={10} label="No ingest endpoints yet." />
                    ) : (
                      data.ingestEndpoints.map((endpoint) => {
                        const stats = endpointStats[endpoint.id];

                        return (
                          <tr key={endpoint.id}>
                            <td className={tableCellClass}>
                              <div className="grid gap-1">
                                <span className="font-medium">{endpoint.name}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {endpoint.slug}
                                </span>
                                {trafficScope === "all" ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    Owner {shortId(endpoint.userId)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={cn(tableCellClass, "max-w-80")}>
                              <span className="block truncate font-mono text-xs">
                                {endpoint.publicIngestUrl}
                              </span>
                            </td>
                            <td className={tableCellClass}>
                              <Badge
                                className={statusBadgeClass(
                                  endpoint.isActive ? "active" : "inactive",
                                )}
                              >
                                {endpoint.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className={tableCellClass}>
                              {stats?.inboundEventCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.deliveryCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.failedDeliveryCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.activeSubscriptionCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(stats?.lastInboundEventAt ?? null)}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(endpoint.createdAt)}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex items-center gap-1">
                                <ActionButton
                                  icon={Copy01Icon}
                                  label="Copy public ingest URL"
                                  onClick={() =>
                                    runAction({
                                      action: () =>
                                        navigator.clipboard.writeText(
                                          endpoint.publicIngestUrl,
                                        ),
                                      key: `copy-${endpoint.id}`,
                                      successText: "Public ingest URL copied.",
                                    })
                                  }
                                />
                                <ActionButton
                                  icon={EyeIcon}
                                  label="View ingest endpoint"
                                  onClick={() =>
                                    setDetailSelection({
                                      id: endpoint.id,
                                      kind: "endpoint",
                                    })
                                  }
                                />
                                {canManageTraffic && endpoint.userId === userId ? (
                                  <ActionButton
                                    icon={PencilEdit02Icon}
                                    label="Edit ingest endpoint"
                                    onClick={() => startEditEndpoint(endpoint)}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-3">
              <SectionHeader
                action={canManageTraffic ? (
                  <ActionButton
                    disabled={data.ingestEndpoints.length === 0}
                    icon={Add01Icon}
                    label="Add webhook subscription"
                    onClick={startCreateSubscription}
                  />
                ) : undefined}
                icon={<HugeiconsIcon aria-hidden icon={WebhookIcon} size={16} />}
                title="Webhook Subscriptions"
              />

              {subscriptionForm && canManageTraffic ? (
                <SubscriptionForm
                  endpoints={data.ingestEndpoints}
                  form={subscriptionForm}
                  isSubmitting={pendingAction === "subscription-form"}
                  onCancel={() => setSubscriptionForm(null)}
                  onChange={setSubscriptionForm}
                  onSubmit={handleSubscriptionSubmit}
                />
              ) : null}

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[70rem] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Subscription</th>
                      <th className={tableHeaderClass}>Ingest endpoint</th>
                      <th className={tableHeaderClass}>Target URL</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Deliveries</th>
                      <th className={tableHeaderClass}>Failed</th>
                      <th className={tableHeaderClass}>Last delivery</th>
                      <th className={tableHeaderClass}>Created</th>
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.webhookSubscriptions.length === 0 ? (
                      <EmptyRow colSpan={9} label="No webhook subscriptions yet." />
                    ) : (
                      data.webhookSubscriptions.map((subscription) => {
                        const endpoint = endpointById.get(subscription.ingestEndpointId);
                        const stats = subscriptionStats[subscription.id];
                        const latestEvent =
                          latestEventByEndpointId[subscription.ingestEndpointId];
                        const retryKey = `subscription-retry-${subscription.id}`;

                        return (
                          <tr key={subscription.id}>
                            <td className={tableCellClass}>
                              <div className="grid gap-1">
                                <span className="font-mono text-xs">
                                  {shortId(subscription.id)}
                                </span>
                                {trafficScope === "all" ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    Owner {shortId(subscription.userId)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={tableCellClass}>
                              {endpoint?.name ?? shortId(subscription.ingestEndpointId)}
                            </td>
                            <td className={cn(tableCellClass, "max-w-96")}>
                              <span className="block truncate font-mono text-xs">
                                {subscription.targetUrl}
                              </span>
                            </td>
                            <td className={tableCellClass}>
                              <Badge
                                className={statusBadgeClass(
                                  subscription.isActive ? "active" : "inactive",
                                )}
                              >
                                {subscription.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className={tableCellClass}>
                              {stats?.deliveryCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.failedDeliveryCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(stats?.lastDeliveryAt ?? null)}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(subscription.createdAt)}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex items-center gap-1">
                                <ActionButton
                                  disabled={
                                    !canManageTraffic ||
                                    subscription.userId !== userId ||
                                    !latestEvent ||
                                    pendingAction === retryKey ||
                                    !subscription.isActive
                                  }
                                  icon={ArrowReloadHorizontalIcon}
                                  label="Retry subscription with latest inbound event"
                                  onClick={() => {
                                    if (!latestEvent) {
                                      return;
                                    }

                                    void runAction({
                                      action: () =>
                                        retryWebhookSubscription(
                                          subscription.id,
                                          latestEvent.id,
                                        ),
                                      key: retryKey,
                                      successText:
                                        "Webhook subscription retry completed.",
                                    });
                                  }}
                                />
                                <ActionButton
                                  icon={EyeIcon}
                                  label="View webhook subscription"
                                  onClick={() =>
                                    setDetailSelection({
                                      id: subscription.id,
                                      kind: "subscription",
                                    })
                                  }
                                />
                                {canManageTraffic && subscription.userId === userId ? (
                                  <ActionButton
                                    icon={PencilEdit02Icon}
                                    label="Edit webhook subscription"
                                    onClick={() => startEditSubscription(subscription)}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-3">
              <SectionHeader
                icon={
                  <HugeiconsIcon aria-hidden icon={DeliveryBox01Icon} size={16} />
                }
                title="Recent Inbound Events"
              />
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[68rem] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Inbound event</th>
                      <th className={tableHeaderClass}>Ingest endpoint</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Received</th>
                      <th className={tableHeaderClass}>Deliveries</th>
                      <th className={tableHeaderClass}>Failed</th>
                      <th className={tableHeaderClass}>Payload preview</th>
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inboundEvents.length === 0 ? (
                      <EmptyRow colSpan={8} label="No inbound events yet." />
                    ) : (
                      data.inboundEvents.map((event) => {
                        const endpoint = endpointById.get(event.ingestEndpointId);
                        const stats = eventStats[event.id];
                        const retryKey = `event-reprocess-${event.id}`;

                        return (
                          <tr key={event.id}>
                            <td className={tableCellClass}>
                              <div className="grid gap-1">
                                <span className="font-mono text-xs">
                                  {shortId(event.id)}
                                </span>
                                {trafficScope === "all" ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    Owner {shortId(event.userId)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={tableCellClass}>
                              {endpoint?.name ?? shortId(event.ingestEndpointId)}
                            </td>
                            <td className={tableCellClass}>
                              <Badge className={statusBadgeClass(event.status)}>
                                {event.status}
                              </Badge>
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(event.receivedAt)}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.deliveryCount ?? 0}
                            </td>
                            <td className={tableCellClass}>
                              {stats?.failedDeliveryCount ?? 0}
                            </td>
                            <td className={cn(tableCellClass, "max-w-sm")}>
                              <span className="block truncate font-mono text-xs">
                                {stringifyPreview(event.payload)}
                              </span>
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex items-center gap-1">
                                <ActionButton
                                  disabled={
                                    !canManageTraffic ||
                                    event.userId !== userId ||
                                    pendingAction === retryKey
                                  }
                                  icon={ReplayIcon}
                                  label="Replay inbound event"
                                  onClick={() =>
                                    runAction({
                                      action: () => reprocessInboundEvent(event.id),
                                      key: retryKey,
                                      successText: "Inbound event replay completed.",
                                    })
                                  }
                                />
                                <ActionButton
                                  icon={EyeIcon}
                                  label="View inbound event"
                                  onClick={() =>
                                    setDetailSelection({
                                      id: event.id,
                                      kind: "event",
                                    })
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-3">
              <SectionHeader
                icon={
                  <HugeiconsIcon aria-hidden icon={DeliveryBox01Icon} size={16} />
                }
                title="Webhook Deliveries and Attempts"
              />
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[86rem] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Delivery</th>
                      <th className={tableHeaderClass}>Inbound event</th>
                      <th className={tableHeaderClass}>Ingest endpoint</th>
                      <th className={tableHeaderClass}>Target URL</th>
                      <th className={tableHeaderClass}>Status</th>
                      <th className={tableHeaderClass}>Attempts</th>
                      <th className={tableHeaderClass}>Last attempt</th>
                      <th className={tableHeaderClass}>Last response</th>
                      <th className={tableHeaderClass}>Last attempted</th>
                      <th className={tableHeaderClass}>Next attempt</th>
                      <th className={tableHeaderClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.webhookDeliveries.length === 0 ? (
                      <EmptyRow colSpan={11} label="No webhook deliveries yet." />
                    ) : (
                      data.webhookDeliveries.map((delivery) => {
                        const event = eventById.get(delivery.inboundEventId);
                        const endpoint = event
                          ? endpointById.get(event.ingestEndpointId)
                          : undefined;
                        const subscription = subscriptionById.get(
                          delivery.webhookSubscriptionId,
                        );
                        const attempts =
                          data.webhookDeliveryAttempts[delivery.id] ?? [];
                        const lastAttempt = attempts[attempts.length - 1];
                        const retryKey = `delivery-retry-${delivery.id}`;

                        return (
                          <tr key={delivery.id}>
                            <td className={tableCellClass}>
                              <div className="grid gap-1">
                                <span className="font-mono text-xs">
                                  {shortId(delivery.id)}
                                </span>
                                {trafficScope === "all" ? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    Owner {shortId(delivery.userId)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={tableCellClass}>
                              <span className="font-mono text-xs">
                                {shortId(delivery.inboundEventId)}
                              </span>
                            </td>
                            <td className={tableCellClass}>
                              {endpoint?.name ?? "Unknown"}
                            </td>
                            <td className={cn(tableCellClass, "max-w-80")}>
                              <span className="block truncate font-mono text-xs">
                                {subscription?.targetUrl ??
                                  lastAttempt?.targetUrl ??
                                  "Unknown"}
                              </span>
                            </td>
                            <td className={tableCellClass}>
                              <Badge className={statusBadgeClass(delivery.status)}>
                                {delivery.status}
                              </Badge>
                            </td>
                            <td className={tableCellClass}>{attempts.length}</td>
                            <td className={tableCellClass}>
                              {lastAttempt ? (
                                <Badge className={statusBadgeClass(lastAttempt.status)}>
                                  {lastAttempt.status}
                                </Badge>
                              ) : (
                                "None"
                              )}
                            </td>
                            <td className={tableCellClass}>
                              {lastAttempt?.responseStatus ?? "None"}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(lastAttempt?.startedAt ?? null)}
                            </td>
                            <td className={tableCellClass}>
                              {formatTimestamp(delivery.nextAttemptAt)}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex items-center gap-1">
                                <ActionButton
                                  disabled={
                                    !canManageTraffic ||
                                    delivery.userId !== userId ||
                                    pendingAction === retryKey
                                  }
                                  icon={ArrowReloadHorizontalIcon}
                                  label="Retry webhook delivery"
                                  onClick={() =>
                                    runAction({
                                      action: () => retryWebhookDelivery(delivery.id),
                                      key: retryKey,
                                      successText: "Webhook delivery retry completed.",
                                    })
                                  }
                                />
                                <ActionButton
                                  icon={EyeIcon}
                                  label="View webhook delivery"
                                  onClick={() =>
                                    setDetailSelection({
                                      id: delivery.id,
                                      kind: "delivery",
                                    })
                                  }
                                />
                                {subscription &&
                                canManageTraffic &&
                                subscription.userId === userId ? (
                                  <ActionButton
                                    icon={PencilEdit02Icon}
                                    label="Edit related webhook subscription"
                                    onClick={() => startEditSubscription(subscription)}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-3">
              <SectionHeader
                icon={<HugeiconsIcon aria-hidden icon={EyeIcon} size={16} />}
                title="Detail"
              />
              <div className="rounded-lg border bg-muted/20 p-3">
                {selectedDetail ? (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-medium">{selectedDetail.title}</h2>
                      <Button
                        onClick={() => setDetailSelection(null)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Clear
                      </Button>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-md bg-background p-3 text-xs leading-6 whitespace-pre-wrap">
                      {JSON.stringify(selectedDetail.value, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No row selected.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

const SectionHeader = ({
  action,
  icon,
  title,
}: {
  action?: ReactNode;
  icon: ReactNode;
  title: string;
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-medium">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
};

const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => {
  return (
    <tr>
      <td className="px-3 py-8 text-center text-sm text-muted-foreground" colSpan={colSpan}>
        {label}
      </td>
    </tr>
  );
};

const EndpointForm = ({
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: EndpointFormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: EndpointFormState) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
}) => {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardTitle>
          {form.mode === "create" ? "Add ingest endpoint" : "Edit ingest endpoint"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <LabeledInput
            id="endpoint-name"
            label="Name"
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
          {form.mode === "create" ? (
            <LabeledInput
              id="endpoint-unique-identifier"
              label="URL slug source"
              onChange={(event) =>
                onChange({ ...form, uniqueIdentifier: event.target.value })
              }
              value={form.uniqueIdentifier}
            />
          ) : null}
          <LabeledInput
            id="endpoint-description"
            label="Description"
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            value={form.description}
          />
          {form.mode === "edit" ? (
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                checked={form.isActive}
                onChange={(event) =>
                  onChange({ ...form, isActive: event.target.checked })
                }
                type="checkbox"
              />
              Active
            </label>
          ) : null}
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving" : "Save"}
            </Button>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const SubscriptionForm = ({
  endpoints,
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
}: {
  endpoints: IngestEndpoint[];
  form: SubscriptionFormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: SubscriptionFormState) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
}) => {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardTitle>
          {form.mode === "create"
            ? "Add webhook subscription"
            : "Edit webhook subscription"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          {form.mode === "create" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="subscription-endpoint">
                Ingest endpoint
              </label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                id="subscription-endpoint"
                onChange={(event) =>
                  onChange({ ...form, ingestEndpointId: event.target.value })
                }
                required
                value={form.ingestEndpointId}
              >
                {endpoints.map((endpoint) => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <LabeledInput
            id="subscription-target-url"
            label="Target URL"
            onChange={(event) => onChange({ ...form, targetUrl: event.target.value })}
            required
            type="url"
            value={form.targetUrl}
          />
          <LabeledInput
            id="subscription-description"
            label="Description"
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            value={form.description}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              checked={form.isActive}
              onChange={(event) =>
                onChange({ ...form, isActive: event.target.checked })
              }
              type="checkbox"
            />
            Active
          </label>
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving" : "Save"}
            </Button>
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Home;
