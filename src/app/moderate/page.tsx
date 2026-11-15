import Queue from "./Queue";

export default function ModeratePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">Moderator desk</h1>
      <p className="mt-3 text-white/75">Host applications with their documents and house photos, and conduct cases from parties. Guest profiles never come here: AI verifies them. Open in this demo so you can try it; in the real product it is for Nestly staff only.</p>
      <Queue />
    </div>
  );
}
