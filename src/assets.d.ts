/**
 * @see https://www.carlrippon.com/using-images-react-typescript-with-webpack5/
 * @see https://www.typescriptlang.org/docs/handbook/modules.html#wildcard-module-declarations
 */
declare module '*.png' {
  const path: string
  export default path
}
