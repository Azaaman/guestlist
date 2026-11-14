import { Suspense } from "react";
import ProfileForm from "./ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-4xl">Your profile</h1>
      <p className="mt-3 text-white/75">Fill this in once. AI checks it in a few seconds, and then you can book any party in one tap. You can edit it any time.</p>
      <Suspense fallback={<p className="mt-8 text-white/60">Loading…</p>}>
        <ProfileForm />
      </Suspense>
    </div>
  );
}
