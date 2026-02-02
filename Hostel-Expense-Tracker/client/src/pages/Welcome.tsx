import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRoom, useJoinRoom } from "@/hooks/use-hostel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, Loader2, Home, Users, Wallet } from "lucide-react";

// Schemas
const createSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters"),
  userName: z.string().min(2, "Your name is required"),
  communalBudget: z.coerce.number().optional(),
  userPersonalBudget: z.coerce.number().optional(),
});

const joinSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 characters").toUpperCase(),
  userName: z.string().min(2, "Your name is required"),
  userPersonalBudget: z.coerce.number().optional(),
});

export default function Welcome() {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", userName: "" },
  });

  const joinForm = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: { code: "", userName: "" },
  });

  const onCreateSubmit = (data: z.infer<typeof createSchema>) => {
    createRoom.mutate(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  const onJoinSubmit = (data: z.infer<typeof joinSchema>) => {
    joinRoom.mutate(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-md mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">
          Hostel<span className="text-primary">Mate</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Split bills, track expenses, and stay friends.
        </p>
      </motion.div>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {mode === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4"
            >
              <Card
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/10"
                onClick={() => setMode("create")}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Create a Room</CardTitle>
                    <CardDescription>Start a new shared space</CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
              </Card>

              <Card
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-accent/10"
                onClick={() => setMode("join")}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Join a Room</CardTitle>
                    <CardDescription>Enter a 6-digit code</CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="shadow-2xl shadow-primary/5 border-none">
                <CardHeader>
                  <CardTitle>Create New Room</CardTitle>
                  <CardDescription>Setup your shared space</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...createForm}>
                    <form
                      onSubmit={createForm.handleSubmit(onCreateSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. The Penthouse"
                                {...field}
                                className="h-11 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Alex"
                                {...field}
                                className="h-11 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={createForm.control}
                            name="communalBudget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shared Budget (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="5000" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={createForm.control}
                            name="userPersonalBudget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Personal Budget (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="2000" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("menu")}
                          className="flex-1 h-11 rounded-xl"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={createRoom.isPending}
                          className="flex-1 h-11 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80"
                        >
                          {createRoom.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="shadow-2xl shadow-accent/5 border-none">
                <CardHeader>
                  <CardTitle>Join Room</CardTitle>
                  <CardDescription>Enter the code from your roommate</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...joinForm}>
                    <form
                      onSubmit={joinForm.handleSubmit(onJoinSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={joinForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. AB12CD"
                                {...field}
                                className="h-11 rounded-xl uppercase tracking-widest text-center font-mono font-bold text-lg"
                                maxLength={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={joinForm.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Jordan"
                                {...field}
                                className="h-11 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                            control={joinForm.control}
                            name="userPersonalBudget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Personal Budget (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="2000" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("menu")}
                          className="flex-1 h-11 rounded-xl"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={joinRoom.isPending}
                          className="flex-1 h-11 rounded-xl font-semibold bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90"
                        >
                          {joinRoom.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Join
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
