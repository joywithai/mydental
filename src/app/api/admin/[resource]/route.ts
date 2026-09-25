/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { desc, eq, getTableColumns, like, or } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resources } from "@/lib/admin-resources";
import { appointments, doctors, patients, services, schedules, maintenanceLogs, equipment } from "@/db/schema";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{resource:string}>}){try{await requireAdmin();const {resource}=await params;const config=resources[resource];if(!config)return NextResponse.json({ok:false,message:"Unknown collection"},{status:404});const q=(req.nextUrl.searchParams.get("q")||"").trim();const limit=Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")||200),1),500);let rows:any[];
if(resource==="appointments"){
  let query:any=db.select({ ...getTableColumns(appointments), patientName:patients.name, doctorName:doctors.name, serviceName:services.name }).from(appointments).leftJoin(patients,eq(appointments.patientId,patients.id)).leftJoin(doctors,eq(appointments.doctorId,doctors.id)).leftJoin(services,eq(appointments.serviceId,services.id));
  if(q) query=query.where(or(like(appointments.reference,`%${q}%`),like(appointments.status,`%${q}%`),like(patients.name,`%${q}%`),like(doctors.name,`%${q}%`),like(services.name,`%${q}%`)));
  rows=await query.orderBy(desc(appointments.date),desc(appointments.startTime)).limit(limit);
}else if(resource==="schedules"){
  const query:any=db.select({ ...getTableColumns(schedules), doctorName:doctors.name }).from(schedules).leftJoin(doctors,eq(schedules.doctorId,doctors.id));
  rows=await query.orderBy(schedules.dayOfWeek,schedules.startTime).limit(limit);
}else if(resource==="maintenance"){
  let query:any=db.select({ ...getTableColumns(maintenanceLogs), equipmentName:equipment.name }).from(maintenanceLogs).leftJoin(equipment,eq(maintenanceLogs.equipmentId,equipment.id));
  if(q) query=query.where(or(like(maintenanceLogs.description,`%${q}%`),like(maintenanceLogs.performedBy,`%${q}%`),like(equipment.name,`%${q}%`)));
  rows=await query.orderBy(desc(maintenanceLogs.date)).limit(limit);
}else{
  let query:any=db.select().from(config.table);
  if(q&&config.searchable.length){const filters=config.searchable.map((k)=>like(config.table[k],`%${q.replace(/[%_]/g,"\\$&")}%`));query=query.where(or(...filters));}
  rows=await query.orderBy(desc(config.table.createdAt||config.table.order||config.table.id)).limit(limit);
  if(resource==="medicines"){
    const today=new Date();today.setHours(0,0,0,0);
    rows=rows.map((row:any)=>{const expiry=row.expiryDate?new Date(row.expiryDate):null;const days=expiry?Math.ceil((expiry.getTime()-today.getTime())/86400000):Infinity;const inventoryStatus=row.quantity<=0?"OUT_OF_STOCK":days<0?"EXPIRED":days<=30?"NEAR_EXPIRY":row.quantity<=row.minStockLevel?"LOW_STOCK":"NORMAL";return {...row,inventoryStatus};});
  }
}
return NextResponse.json({ok:true,rows});}catch(e){return NextResponse.json({ok:false,message:e instanceof Error&&e.message==="UNAUTHORIZED"?"Unauthorized":"Could not load records."},{status:e instanceof Error&&e.message==="UNAUTHORIZED"?401:500});}}
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
export async function POST(req:NextRequest,{params}:{params:Promise<{resource:string}>}){try{await requireAdmin();const {resource}=await params;const config=resources[resource];if(!config)return NextResponse.json({ok:false,message:"Unknown collection"},{status:404});let input:any;try{input=await req.json()}catch{return NextResponse.json({ok:false,message:"Invalid JSON"},{status:400});}if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({ok:false,message:"Invalid record"},{status:400});const values=normalize(config,input);for(const key of config.required)if(values[key]===undefined||values[key]===null||values[key]==="")return NextResponse.json({ok:false,message:`${config.fields.find((f:any)=>f.key===key)?.label||key} is required.`},{status:400});const inserted:any=await db.insert(config.table).values(values).returning();const row=Array.isArray(inserted)?inserted[0]:inserted;return NextResponse.json({ok:true,row});}catch(e){const unauthorized=e instanceof Error&&e.message==="UNAUTHORIZED";return NextResponse.json({ok:false,message:unauthorized?"Unauthorized":e instanceof Error?e.message:"Could not create record."},{status:unauthorized?401:400});}}
