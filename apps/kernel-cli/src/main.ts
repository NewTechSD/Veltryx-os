import { VeltryxKernel, createBootstrapContext } from "@veltryx/kernel";

const kernel = new VeltryxKernel();
const context = createBootstrapContext();

await kernel.bootstrap(context);
await kernel.initialize(context);
const result = await kernel.ready(context);

console.log(result.message);

