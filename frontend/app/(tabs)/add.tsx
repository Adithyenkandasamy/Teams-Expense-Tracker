import React, { useEffect } from "react";
import { useRouter } from "expo-router";

export default function AddTabRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/expenses/create"); }, [router]);
  return null;
}
