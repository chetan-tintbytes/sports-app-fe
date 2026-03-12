"use client";

import { getToken } from "@/utils/lib/auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function Root() {
  const token = getToken();
    const router = useRouter();
  
    useEffect(() => {
      const fetchProfile = async () => {
        if (!token) {
          router.push("/login");
          return;
        }
      };
  
      fetchProfile();
    }, [router]);
  
    if (token) {
      router.push("/dashboard");
      return;
    }
}
