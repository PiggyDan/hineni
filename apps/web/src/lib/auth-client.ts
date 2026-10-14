"use client";

import { createAuthClient } from "better-auth/react";

/** Same-origin client: cookies are httpOnly and set by the API. */
export const authClient = createAuthClient();
