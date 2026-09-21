// Preload for older browser suites whose data fixtures use 18 September 2026.
// Applied only to isolated test contexts; production date helpers remain unchanged.
const {chromium}=require('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
 const browser=await launch(...args),newContext=browser.newContext.bind(browser);
 browser.newContext=async(...options)=>{
  const context=await newContext(...options);
  await context.addInitScript(()=>{const NativeDate=Date,now=NativeDate.parse('2026-09-18T05:00:00+07:00');window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}});
  return context;
 };
 return browser;
};
