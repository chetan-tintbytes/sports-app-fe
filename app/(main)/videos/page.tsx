import { redirect } from "next/navigation";

// The Videos section is split into two sub-routes: /videos/my-videos and
// /videos/all. Hitting /videos directly (e.g. from older links or the dashboard)
// lands on My Videos.
export default function VideosPage() {
  redirect("/videos/my-videos");
}