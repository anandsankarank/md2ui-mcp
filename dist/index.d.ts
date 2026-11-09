#!/usr/bin/env node
export interface BundleSource {
    mode: 'inline' | 'cdn';
    js?: string;
    css?: string;
    jsUrl?: string;
    cssUrl?: string;
}
export interface FormSubmission {
    id: string;
    formId: string;
    values: Record<string, any>;
    timestamp: string;
}
