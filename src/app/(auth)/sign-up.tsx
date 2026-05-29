import { Redirect, type Href } from "expo-router";

export default function SignUpScreen() {
  return <Redirect href={"/verify" as Href} />;
}
