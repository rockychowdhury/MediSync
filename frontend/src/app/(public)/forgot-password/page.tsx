"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call to send reset email
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <Card className="border-0 shadow-lg sm:border sm:shadow-sm">
      <CardHeader className="space-y-1 pb-6 relative">
        <Link 
          href="/login"
          className="absolute left-4 top-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to login</span>
        </Link>
        <CardTitle className="text-2xl font-heading font-bold text-center mt-2">
          Reset password
        </CardTitle>
        <CardDescription className="text-center mt-2">
          Enter your email and we&apos;ll send you instructions to reset your password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isSent ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-success" />
            </div>
            <p className="font-medium text-foreground">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to your email address.
            </p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-6 w-full"
              onClick={() => setIsSent(false)}
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary mt-4" disabled={isLoading}>
              {isLoading ? "Sending link..." : "Send Reset Link"}
              {!isLoading && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        )}
      </CardContent>
      
      {!isSent && (
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-medium underline-offset-4 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
