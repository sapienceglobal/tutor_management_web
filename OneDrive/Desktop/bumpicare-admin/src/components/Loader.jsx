
import React from "react";

export default function Loader({ className = "h-12 w-12" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-white" />
    </div>
  );
}
