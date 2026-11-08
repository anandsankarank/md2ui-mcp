#!/usr/bin/env node
export interface BundleSource {
    mode: 'inline' | 'cdn';
    js?: string;
    css?: string;
    jsUrl?: string;
    cssUrl?: string;
}
