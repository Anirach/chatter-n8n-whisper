
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, Check, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  webhookUrl: z.string().url("Please enter a valid URL"),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsDialogProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

const SettingsDialog = ({ currentUrl, onUrlChange }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      webhookUrl: currentUrl,
    },
  });

  const testConnection = async (url: string) => {
    setIsTesting(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Connection test",
        }),
      });

      if (response.ok) {
        toast.success("Connection successful!");
        return true;
      } else {
        const data = await response.json();
        toast.error(`Connection failed: ${data.message || response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error("Connection test error:", error);
      toast.error("Connection failed. Check the URL and try again.");
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const connectionSuccessful = await testConnection(values.webhookUrl);
    if (connectionSuccessful) {
      onUrlChange(values.webhookUrl);
      setOpen(false);
      toast.success("Webhook URL updated successfully");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Settings</DialogTitle>
            <DialogDescription>
              Configure the webhook URL for your chat assistant.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    testConnection(form.getValues().webhookUrl);
                  }}
                  disabled={isTesting || !form.formState.isValid}
                  className="mr-2"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      Test Connection
                    </>
                  )}
                </Button>
                <Button type="submit" disabled={isTesting || !form.formState.isDirty}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDialog;
