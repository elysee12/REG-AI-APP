"use client";

import React from "react";

interface NoSsrProps {
  children: React.ReactNode;
}

export const NoSsr: React.FC<NoSsrProps> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
};
