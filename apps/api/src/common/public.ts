import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "r4c:is-public";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
