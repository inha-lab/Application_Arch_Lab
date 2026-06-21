export function makeInitialPassword(phone:string){let digits=phone.replace(/\D/g,'');if(digits.startsWith('010')) digits=digits.slice(3);return digits.length<8?digits.padEnd(8,'0'):digits.slice(0,8)}
