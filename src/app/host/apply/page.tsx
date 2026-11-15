import { Suspense } from "react";
import HostApplyForm from "./HostApplyForm";

export const metadata = { title: "Become a host, Nestly" };

export default function HostApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl">Become a host</h1>
      <p className="mt-3 text-white/80">Open your home for a Nestly night and keep 50% of ticket revenue. Upload your ID, proof that you can host at this address, and photos of the house. A Nestly moderator checks everything, usually within two days.</p>
      <Suspense fallback={<p className="mt-8 text-white/60">Loading…</p>}>
        <HostApplyForm />
      </Suspense>
    </div>
  );
}
