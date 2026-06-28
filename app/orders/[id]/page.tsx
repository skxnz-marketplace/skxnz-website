import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { OrderDetailShell } from "@/components/orders/order-detail-shell";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <DemoRoleGate
      allowedRoles={["buyer"]}
      areaLabel="Buyer order detail"
      helperText="Order detail stays inside buyer demo mode so the lifecycle can be reviewed safely before real account access is connected."
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <OrderDetailShell orderId={id} />
      </div>
    </DemoRoleGate>
  );
}
