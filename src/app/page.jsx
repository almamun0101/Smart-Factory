import { redirect } from "next/navigation";
function Home() {
  redirect("/dashboard");
}
export {
  Home as default
};
