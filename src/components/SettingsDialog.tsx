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
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      webhookUrl: currentUrl,
    },
  });

  const resetTestStatus = () => {
    setTestStatus('idle');
    setTestMessage("");
  };

  const testConnection = async (url: string) => {
    resetTestStatus();
    setIsTesting(true);
    
    try {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Connection test",
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok before trying to parse json
      if (response.ok) {
        try {
          // Try to get response as text first
          const responseText = await response.text();
          
          // If we got a response (even empty), consider it successful
          setTestStatus('success');
          setTestMessage("Connection successful!");
          toast.success("Connection successful!");
          return true;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          // Even if we can't parse the response, if status was ok, consider it a success
          setTestStatus('success');
          setTestMessage("Connection successful, but response format may not be ideal.");
          toast.success("Connection successful!");
          return true;
        }
      } else {
        const errorMessage = `Connection failed: HTTP ${response.status} - ${response.statusText}`;
        setTestStatus('error');
        setTestMessage(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Connection test error:", error);
      
      let errorMessage = "Connection failed. ";
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage += "Request timed out. The server may be down or unreachable.";
        } else if (error.message === "Failed to fetch") {
          errorMessage += "Network error occurred. This may be due to CORS restrictions or the server is unreachable.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "An unknown error occurred. Check the URL and try again.";
      }
      
      setTestStatus('error');
      setTestMessage(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Save the URL even without testing in this environment
    onUrlChange(values.webhookUrl);
    setOpen(false);
    toast.success("Webhook URL updated successfully");
    
    // Optional: You can still attempt to test
    testConnection(values.webhookUrl).catch(() => {
      // Silently handle any test errors after saving
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setOpen(true);
          resetTestStatus();
        }}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          resetTestStatus();
        }
      }}>
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
                      <Input 
                        placeholder="https://..." 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          resetTestStatus();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {testStatus !== 'idle' && (
                <div className={`p-3 rounded-md flex items-start gap-2 ${
                  testStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testStatus === 'success' ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <p className="text-sm">{testMessage}</p>
                </div>
              )}

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
                <Button 
                  type="submit" 
                  disabled={isTesting || (!form.formState.isDirty && testStatus !== 'success')}
                >
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
