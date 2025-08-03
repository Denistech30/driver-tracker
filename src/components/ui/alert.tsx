import * as React from "react"
import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";

const AlertPrimitive = RadixAlertDialog.Content;
const AlertTitlePrimitive = RadixAlertDialog.Title;
const AlertDescriptionPrimitive = RadixAlertDialog.Description;
import { cn } from "../../lib/cn"

const Alert = React.forwardRef<
  React.ElementRef<typeof AlertPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertPrimitive>
>(({ className, ...props }, ref) => (
  <AlertPrimitive
    ref={ref}
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg~*]:mt-4 [&>svg+div]:translate-y-[-3px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:flex-shrink-0 [&>div]:text-sm [&>div]:font-medium",
      className
    )}
    {...props}
  />
))

const AlertTitle = React.forwardRef<
  React.ElementRef<typeof AlertTitlePrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertTitlePrimitive>
>(({ className, ...props }, ref) => (
  <AlertTitlePrimitive
    ref={ref}
    className={cn("text-sm font-medium", className)}
    {...props}
  />
))

const AlertDescription = React.forwardRef<
  React.ElementRef<typeof AlertDescriptionPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDescriptionPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDescriptionPrimitive
    ref={ref}
    className={cn("mt-2 text-sm text-muted-foreground", className)}
    {...props}
  />
))

Alert.displayName = AlertPrimitive.displayName
AlertTitle.displayName = AlertTitlePrimitive.displayName
AlertDescription.displayName = AlertDescriptionPrimitive.displayName

export { Alert, AlertTitle, AlertDescription }
