import {getSettings} from "@/lib/settings";import {SettingsForm} from "@/components/admin/settings-form";
export const dynamic="force-dynamic";
export default async function SettingsPage(){const settings=await getSettings();return <div><div className="mb-5"><h2 className="text-2xl font-bold">Chamber settings</h2><p className="mt-1 text-sm text-muted-foreground">Update the public website identity, contact details, hours and content.</p></div><SettingsForm initial={settings}/></div>}
