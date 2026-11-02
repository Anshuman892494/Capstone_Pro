// Browser regression check using local-only API fixtures. Run with playwright-cli run-code --filename.
async (page) => {
 const names = ['Books & Notes','Fashion & Lifestyle','Hostel & Room Essentials','Laptops & Computers','Mobiles & Electronics','Others','Sports & Fitness','Stationery & Lab Gear'];
 await page.route('**/api/**', route => {
  const url = route.request().url();
  const data = url.includes('/categories/') ? names.map((name,i)=>({id:String(i),name,slug:'category-'+i,icon:'BookOpen'})) : url.includes('/auth/') ? {isAuthenticated:false} : url.includes('config') ? {} : [];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.emulateMedia({reducedMotion:'reduce'});
 const results=[];
 for (const width of [1280,390]) {
  await page.setViewportSize({width,height:800}); await page.goto('http://127.0.0.1:5173/');
  const group=page.getByRole('group',{name:'Marketplace categories'});
  const left=group.getByRole('button',{name:'Scroll categories left'});
  const right=group.getByRole('button',{name:'Scroll categories right'});
  await right.waitFor({state:'visible'});
  if(await left.count()) throw Error('Left visible at start');
  await right.focus();
  await page.keyboard.press('Enter');
  await left.waitFor({state:'visible'});
  await group.locator('div.overflow-x-auto').evaluate(el => el.scrollTo({left:(el.scrollWidth-el.clientWidth)/2,behavior:'instant'}));
  await right.waitFor({state:'visible'});
  await left.waitFor({state:'visible'});
  await page.screenshot({path:'.playwright-cli/categories-'+width+'.png'});
  for(let i=0;i<15 && await right.count();i++) { await right.click(); await page.waitForTimeout(100); }
  if(await right.count() || !(await left.isVisible())) throw Error('Wrong end arrows');
  await group.getByRole('button',{name:names[7]}).click();
  if(!page.url().includes('category=category-7')) throw Error('Selection broken');
  for(let i=0;i<15 && await left.count();i++) { await left.click(); await page.waitForTimeout(100); }
  if(await left.count() || !(await right.isVisible())) throw Error('Wrong return arrows');
  results.push({width,edges:'pass',selection:'pass'});
 }
 await page.setViewportSize({width:2400,height:800});
 await page.getByRole('button',{name:'Scroll categories right'}).waitFor({state:'hidden'});
 if(await page.getByRole('button',{name:'Scroll categories left'}).count()) throw Error('Left visible without overflow');
 results.push({noOverflow:'pass'}); console.log(JSON.stringify(results));
}
