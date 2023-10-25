type Plugin = () => (buf: Buffer) => Promise<void>
declare const plugin: Plugin
export default plugin
