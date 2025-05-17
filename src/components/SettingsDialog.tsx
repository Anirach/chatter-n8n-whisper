
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
      console.log("Testing connection to:", url);
      
      // Add a longer timeout to the fetch request (20 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
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
        
        // Log the raw response before processing
        const responseText = await response.text();
        console.log("Test connection raw response:", responseText);
        
        // Check if response is ok
        if (response.ok) {
          // Try to parse response if it exists
          if (responseText && responseText.trim() !== '') {
            try {
              // Try to parse as JSON
              const jsonResponse = JSON.parse(responseText);
              
              // Check if we get an expected response format
              const isValidFormat = 
                (Array.isArray(jsonResponse) && jsonResponse.length > 0) ||
                (typeof jsonResponse === 'object' && jsonResponse !== null);
              
              setTestStatus('success');
              setTestMessage(`Connection successful! ${isValidFormat ? 'Response format looks good.' : 'Response is in JSON format.'}`);
            } catch (parseError) {
              // Not JSON but we got a response
              console.log("Response is not JSON:", parseError);
              setTestStatus('success');
              setTestMessage("Connection successful, but response is not in JSON format.");
            }
          } else {
            // Empty but successful response
            setTestStatus('success');
            setTestMessage("Connection successful! Server responded with an empty response.");
          }
          
          toast.success("Connection successful!");
          return true;
        } else {
          const errorMessage = `Connection failed: HTTP ${response.status} - ${response.statusText}`;
          setTestStatus('error');
          setTestMessage(errorMessage);
          toast.error(errorMessage);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error("Connection test error:", error);
      
      let errorMessage = "Connection failed. ";
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage += "Request timed out after 20 seconds. The server may be busy or experiencing high load.";
        } else if (error.message === "Failed to fetch") {
          errorMessage += "Network error occurred. This may be due to CORS restrictions, incorrect URL format, or the server is unreachable.";
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
