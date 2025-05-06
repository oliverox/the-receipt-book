/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as contacts from "../contacts.js";
import type * as itemCategories from "../itemCategories.js";
import type * as myFunctions from "../myFunctions.js";
import type * as receiptTypes from "../receiptTypes.js";
import type * as receipts from "../receipts.js";
import type * as settings from "../settings.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  contacts: typeof contacts;
  itemCategories: typeof itemCategories;
  myFunctions: typeof myFunctions;
  receiptTypes: typeof receiptTypes;
  receipts: typeof receipts;
  settings: typeof settings;
  templates: typeof templates;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
