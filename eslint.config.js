import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
);
