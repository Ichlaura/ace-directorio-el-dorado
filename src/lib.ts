import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const configured=Boolean(url&&key);
export const db=configured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export type Business={id:string;name:string;category:string;city:string;address:string|null;description:string|null;image_url:string|null;whatsapp:string|null;instagram:string|null;facebook:string|null;website:string|null;owner_name:string|null;private_support_request:string|null;featured:boolean;status:'pending'|'approved'|'rejected';created_at:string};
export type Category={id:string;name:string;sort_order:number};
export type Role='superadmin'|'admin'|null;
export const defaults=['Alimentos y bebidas','Moda y accesorios','Belleza y cuidado personal','Artesanías y regalos','Hogar y decoración','Tecnología','Educación','Salud y bienestar','Servicios profesionales','Agricultura y productos naturales','Turismo y entretenimiento','Otros'];
export function safeUrl(value?:string|null){if(!value)return undefined;try{const url=new URL(value.startsWith('http')?value:`https://${value}`);return ['http:','https:'].includes(url.protocol)?url.href:undefined}catch{return undefined}}
export function instagramUrl(value?:string|null){if(!value)return undefined;if(value.startsWith('@'))return `https://instagram.com/${value.slice(1)}`;return safeUrl(value)}
export function whatsappUrl(value?:string|null){const n=(value||'').replace(/\D/g,'');if(!n)return undefined;return `https://wa.me/${n.length===10?'57'+n:n}`}
