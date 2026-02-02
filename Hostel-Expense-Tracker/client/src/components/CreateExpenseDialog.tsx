import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { useCreateExpense, useRoomUsers } from "@/hooks/use-hostel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Loader2, Users, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";

const formSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

const categories = ["Food", "Electricity", "WiFi", "Travel", "Laundry", "Misc"];

interface CreateExpenseDialogProps {
  roomId: number;
  userId: number;
  trigger?: React.ReactNode;
  defaultType?: "shared" | "personal";
  defaultCategory?: string;
  quickAddMode?: boolean;
}

export function CreateExpenseDialog({ 
  roomId, 
  userId, 
  trigger,
  defaultType = "shared",
  defaultCategory = "Food",
  quickAddMode = false 
}: CreateExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense();
  const { data: users } = useRoomUsers(roomId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: 0,
      type: defaultType,
      category: defaultCategory,
      roomId: roomId,
      paidById: userId,
    },
  });

  const watchedAmount = useWatch({ control: form.control, name: "amount" });
  const watchedType = useWatch({ control: form.control, name: "type" });
  
  const userCount = users?.length || 1;
  const splitAmount = watchedType === "shared" && watchedAmount > 0 
    ? (watchedAmount / userCount).toFixed(0) 
    : null;

  function onSubmit(data: FormValues) {
    // Convert back to what the hook expects (string for amount is handled in hook)
    createExpense.mutate(
      { ...data, amount: String(data.amount) },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full gap-2 shadow-lg shadow-primary/25 rounded-xl h-12 text-base" data-testid="button-add-expense">
            <PlusCircle className="w-5 h-5" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-display text-primary">
            {quickAddMode ? (
              <span className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Quick Food Expense
              </span>
            ) : (
              "New Expense"
            )}
          </DialogTitle>
          {quickAddMode && (
            <DialogDescription className="text-muted-foreground">
              Quickly add today's shared food expense
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Grocery, Pizza, Bill..." {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        className="rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Split Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="shared" data-testid="radio-shared" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Shared (Split equally)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="personal" data-testid="radio-personal" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Personal
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 
              UX Rationale: Split Preview
              - Shows exactly how the expense will be divided before submission
              - Reduces mental math and prevents confusion
              - Builds confidence that the app handles splitting correctly
            */}
            {splitAmount && (
              <Card className="bg-accent/10 border-accent/20 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Split Preview:</span>
                  <span className="font-semibold text-accent">
                    ₹{splitAmount} each
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({userCount} roommates)
                  </span>
                </div>
              </Card>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={createExpense.isPending}
                className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {createExpense.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {createExpense.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
