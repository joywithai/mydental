/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextRequest,NextResponse} from "next/server";import {eq} from "drizzle-orm";import {db} from "@/db";import {requireAdmin} from "@/lib/auth";import {resources} from "@/lib/admin-resources";
export const dynamic="force-dynamic";
function normalize(config:any,input:any){
  const out:any={};
  for(const key of config.writable){
    if(!(key in input))continue;
    const v=input[key];
    const field=config.fields.find((f:any)=>f.key===key);
    if(field?.type==="checkbox"){
      if(typeof v!=="boolean")throw new Error(`${field.label} is invalid.`);
      out[key]=v;continue;
    }
    if(v===null||v===""){
      if(field?.type==="number")out[key]=["consultationFee","purchasePrice","cost"].includes(key)?null:0;
      else if(field?.type==="date")out[key]=null;
      else out[key]=v===null?null:"";
      continue;
    }
    if(field?.type==="number"||key==="dayOfWeek"){
      const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error(`${field.label} must be a valid non-negative number.`);
      if(key==="dayOfWeek"&&n>6)throw new Error("Weekday must be from 0 to 6.");
      if(key==="rating"&&(n<1||n>5))throw new Error("Rating must be from 1 to 5.");
      if(key==="slotMinutes"&&(n<5||n>240))throw new Error("Slot length must be 5 to 240 minutes.");
      out[key]=n;
    }else if(field?.type==="date"){
      if(typeof v!=="string")throw new Error(`${field.label} is invalid.`);
      const d=new Date(`${v.slice(0,10)}T00:00:00.000Z`);if(Number.isNaN(d.getTime()))throw new Error(`${field.label} is invalid.`);out[key]=d;
    }else{
      if(typeof v!=="string")throw new Error(`${field?.label||key} must be text.`);
      const value=v.trim();
      if(field?.type==="time"&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))throw new Error(`${field.label} must be a valid time.`);if(value.length>(field?.type==="textarea"?10000:1000))throw new Error(`${field?.label||key} is too long.`);
      if(field?.type==="select"&&field.options?.length&&!field.options.includes(value))throw new Error(`${field.label} is not a valid option.`);
      out[key]=value;
    }
  }
  return out;
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{resource:string;id:string}>}){try{await requireAdmin();const {resource,id}=await params;const c=resources[resource];if(!c)return NextResponse.json({ok:false,message:"Unknown collection"},{status:404});const input=await req.json();if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({ok:false,message:"Invalid record"},{status:400});const values=normalize(c,input);const updated:any=await db.update(c.table).set(values).where(eq(c.table.id,id)).returning();const row=Array.isArray(updated)?updated[0]:updated;if(!row)return NextResponse.json({ok:false,message:"Record not found"},{status:404});return NextResponse.json({ok:true,row});}catch(e){const unauthorized=e instanceof Error&&e.message==="UNAUTHORIZED";return NextResponse.json({ok:false,message:unauthorized?"Unauthorized":e instanceof Error?e.message:"Could not update record."},{status:unauthorized?401:400});}}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{resource:string;id:string}>}){try{await requireAdmin();const {resource,id}=await params;const c=resources[resource];if(!c)return NextResponse.json({ok:false,message:"Unknown collection"},{status:404});if(resource==="appointments")return NextResponse.json({ok:false,message:"Appointments cannot be deleted. Update the status instead."},{status:400});const deleted:any=await db.delete(c.table).where(eq(c.table.id,id)).returning({id:c.table.id});const row=Array.isArray(deleted)?deleted[0]:deleted;if(!row)return NextResponse.json({ok:false,message:"Record not found"},{status:404});return NextResponse.json({ok:true});}catch(e){const unauthorized=e instanceof Error&&e.message==="UNAUTHORIZED";return NextResponse.json({ok:false,message:unauthorized?"Unauthorized":"Could not delete record."},{status:unauthorized?401:500});}}
