import React from "react";
import { Spinner } from "flowbite-react";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Spinner aria-label="Default status example" />
    </div>
  );
}