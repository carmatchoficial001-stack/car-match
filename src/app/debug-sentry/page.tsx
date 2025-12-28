"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function DebugSentryPage() {
    const [error, setError] = useState(false);

    if (error) {
        throw new Error("Sentry Test Error: This is a deliberate crash!");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-8">Sentry Debug Page</h1>
            <p className="mb-4 text-slate-400 text-center max-w-md">
                Clicking the button below will intentionally crash this React component.
                Sentry should capture this error and report it to your dashboard.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => setError(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    Throw Test Error
                </button>
                <button
                    onClick={() => {
                        try {
                            throw new Error("Sentry Test Error: Handled Exception");
                        } catch (e) {
                            Sentry.captureException(e);
                            alert("Handled exception sent to Sentry!");
                        }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    Capture Handled Error
                </button>
            </div>
        </div>
    );
}
