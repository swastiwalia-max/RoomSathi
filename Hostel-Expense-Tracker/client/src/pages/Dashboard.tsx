import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from "recharts";
import { format } from "date-fns";
import { 
  Wallet, Users, LogOut, Copy, Trash2, User, Share2, 
  Settings, RefreshCw, Utensils
} from "lucide-react";

import { useRoom, useRoomUsers, useExpenses, useDeleteExpense, useResetMonth } from "@/hooks/use-hostel";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { CreateExpenseDialog } from "@/components/CreateExpenseDialog";
import { CategoryIcon, getCategoryColor } from "@/components/CategoryIcon";

const COLORS = ['#5B8CFF', '#2EC4B6', '#8B5CF6', '#FACC15', '#22C55E', '#EF4444'];

export default function Dashboard() {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const rId = localStorage.getItem("hostel_room_id");
    const uId = localStorage.getItem("hostel_user_id");
    
    if (!rId || !uId) {
      setLocation("/");
    } else {
      setRoomId(Number(rId));
      setUserId(Number(uId));
    }
  }, [setLocation]);

  const { data: room, isLoading: roomLoading } = useRoom(roomId || 0);
  const { data: users, isLoading: usersLoading } = useRoomUsers(roomId || 0);
  const { data: expenses, isLoading: expensesLoading } = useExpenses(roomId || 0);
  
  const deleteExpense = useDeleteExpense();
  const resetMonth = useResetMonth(roomId || 0);

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast({ title: "Copied!", description: "Room code copied to clipboard" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setLocation("/");
  };

  // Calculations
  const currentUser = users?.find(u => u.id === userId);
  
  const sharedExpenses = expenses?.filter(e => e.type === "shared") || [];
  const personalExpenses = expenses?.filter(e => e.type === "personal" && e.paidById === userId) || [];
  
  const totalShared = sharedExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPersonal = personalExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  // Calculate what I owe / am owed
  // Simplified: Split total shared by user count. 
  // If I paid more than my share, I am owed. If less, I owe.
  const userCount = users?.length || 1;
  const splitAmount = totalShared / userCount;
  
  const mySharedContribution = sharedExpenses
    .filter(e => e.paidById === userId)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const balance = mySharedContribution - splitAmount;
  
  // Prepare chart data
  const categoryData = expenses?.reduce((acc: any, curr) => {
    const existing = acc.find((item: any) => item.name === curr.category);
    if (existing) {
      existing.value += Number(curr.amount);
    } else {
      acc.push({ name: curr.category, value: Number(curr.amount) });
    }
    return acc;
  }, []) || [];

  if (roomLoading || usersLoading || expensesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">{room?.name}</h1>
                    <div 
                        className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={copyCode}
                    >
                        Code: {room?.code} <Copy className="w-3 h-3" />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                       <LogOut className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Room?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will log you out. Your data will remain in the room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Welcome & Balance */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
            <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-lg shadow-primary/20">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Hello, {currentUser?.name}</p>
                            <h2 className="text-3xl font-bold mt-1">
                              {balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toFixed(0)}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                              {balance >= 0 ? "You get back" : "You owe"}
                            </p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs text-blue-100 mb-1">
                                <span>Personal Budget</span>
                                <span>₹{totalPersonal} / ₹{currentUser?.personalBudget || 0}</span>
                            </div>
                            <Progress value={(totalPersonal / Number(currentUser?.personalBudget || 1)) * 100} className="h-2 bg-blue-900/30" indicatorClassName="bg-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-soft">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between gap-2 flex-wrap">
                        Room Overview
                        <Badge variant="outline" className="font-normal">
                             Month Total: ₹{totalShared}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                         <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Communal Budget Used</span>
                                <span className="font-medium">{Math.round((totalShared / Number(room?.communalBudget || 1)) * 100)}%</span>
                            </div>
                            <Progress 
                                value={(totalShared / Number(room?.communalBudget || 1)) * 100} 
                                className="h-3"
                                indicatorClassName="bg-gradient-to-r from-teal-400 to-teal-500" 
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {users?.map(user => (
                                <div key={user.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* 
          UX Rationale: "Ab Kya Khaya?" Quick-Add Button
          - Food is the most frequent shared hostel expense
          - Contextual, informal Hindi/English language lowers cognitive load
          - Single-tap path encourages consistent expense logging
          - Cultural phrasing increases emotional connection and memorability
          - Placed prominently in hero section for thumb-friendly mobile access
        */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CreateExpenseDialog
            roomId={roomId!}
            userId={userId!}
            defaultType="shared"
            defaultCategory="Food"
            quickAddMode={true}
            trigger={
              <Card 
                className="bg-gradient-to-r from-accent to-teal-500 text-white border-none shadow-lg shadow-accent/25 cursor-pointer hover:shadow-xl hover:shadow-accent/30 transition-all duration-200 hover:-translate-y-0.5"
                data-testid="button-quick-add-food"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">Ab Kya Khaya?</h3>
                      <p className="text-teal-100 text-sm">Quickly add today's shared food expense</p>
                    </div>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                    <span className="text-xl">+</span>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
             <CreateExpenseDialog 
                roomId={roomId!} 
                userId={userId!} 
             />
             
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1 rounded-xl h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset Month
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Fresh Month?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive all current expenses and reset totals. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => resetMonth.mutate()}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
        </div>

        {/* Tabs for Feed, Settlements, Insights */}
        <Tabs defaultValue="feed" className="w-full">
            <TabsList className="w-full bg-muted/50 p-1 rounded-xl h-12 grid grid-cols-3 mb-6">
                <TabsTrigger value="feed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Feed</TabsTrigger>
                <TabsTrigger value="settlements" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Settlements</TabsTrigger>
                <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
                {expenses?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border border-dashed">
                        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Copy className="w-6 h-6 opacity-50" />
                        </div>
                        <p>No expenses yet.</p>
                        <p className="text-sm">Tap 'Add Expense' to get started.</p>
                    </div>
                ) : (
                    expenses?.slice().reverse().map((expense, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={expense.id}
                        >
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${getCategoryColor(expense.category)}`}>
                                            <CategoryIcon category={expense.category} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{expense.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{expense.paidBy.name}</span>
                                                <span>•</span>
                                                <span>{format(new Date(expense.date!), 'MMM d')}</span>
                                                {expense.type === 'personal' && (
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Personal</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-bold ${expense.type === 'shared' ? 'text-primary' : 'text-muted-foreground'}`}>
                                            ₹{expense.amount}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => deleteExpense.mutate(expense.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </TabsContent>

            <TabsContent value="settlements">
                <Card className="border-none shadow-soft">
                    <CardHeader>
                        <CardTitle>Who Owes Who</CardTitle>
                        <CardDescription>Based on shared expenses only</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {users?.map(user => {
                            // Calculate user's net position
                            const paid = sharedExpenses
                                .filter(e => e.paidById === user.id)
                                .reduce((acc, curr) => acc + Number(curr.amount), 0);
                            
                            const share = totalShared / userCount;
                            const net = paid - share;
                            
                            if (Math.abs(net) < 1) return null; // Ignore negligible amounts

                            return (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                    <div className={`font-bold ${net > 0 ? 'text-success' : 'text-destructive'}`}>
                                        {net > 0 ? 'Gets back' : 'Pays'} ₹{Math.abs(net).toFixed(0)}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {totalShared === 0 && (
                            <p className="text-center text-muted-foreground py-4">No shared expenses to settle yet.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="insights">
                <Card className="border-none shadow-soft">
                    <CardHeader>
                        <CardTitle>Spending Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => `₹${value}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground">No data to display</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
