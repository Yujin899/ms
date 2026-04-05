"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { playClickSound } from "@/lib/audio"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-x border-t border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground hover:bg-primary/95 border-b-4 border-primary-shadow active:border-b-0 active:translate-y-[2px] disabled:border-b-2 disabled:translate-y-[2px] disabled:shadow-none",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted border-b-4 border-border-shadow active:border-b-0 active:translate-y-[2px] disabled:border-b-2 disabled:translate-y-[2px] disabled:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-b-4 border-secondary-shadow active:border-b-0 active:translate-y-[2px] disabled:border-b-2 disabled:translate-y-[2px] disabled:shadow-none",
        hero:
          "bg-primary text-primary-foreground hover:bg-primary/95 border-b-[6px] border-primary-shadow active:border-b-2 active:translate-y-[4px] disabled:border-b-2 disabled:translate-y-[2px] disabled:shadow-none font-black",
        ghost:
          "text-foreground hover:bg-muted active:translate-y-px duration-75",
        destructive:
          "bg-destructive text-destructive-foreground border-b-4 border-destructive-shadow active:border-b-0 active:translate-y-[2px] disabled:border-b-2 disabled:translate-y-[2px] disabled:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 rounded-2xl pt-2 pb-3",
        xs: "h-8 px-3 text-xs rounded-lg border-b-2 active:border-b-0 active:translate-y-px pt-1 pb-1.5",
        sm: "h-9 px-4 text-[0.8rem] rounded-xl border-b-2 active:border-b-0 active:translate-y-px pt-1.5 pb-2",
        lg: "h-14 px-8 text-lg rounded-2xl pt-3 pb-4",
        xl: "h-20 px-12 text-2xl rounded-[24px] pt-[24px] pb-[34px]",
        icon: "size-11 pt-2 pb-3",
        "icon-xs": "size-8 pt-1 pb-1.5",
        "icon-sm": "size-9 pt-1.5 pb-2",
        "icon-lg": "size-14 pt-3 pb-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  onClick,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const isChunky = ["default", "outline", "secondary", "hero", "destructive"].includes(variant || "")
  const shiftAmount = variant === "hero" ? "-translate-y-[2.5px]" : "-translate-y-[1.5px]"

  // Tactile sound feedback
  const handleClick = (event: Parameters<NonNullable<ButtonPrimitive.Props["onClick"]>>[0]) => {
    if (isChunky || variant === "ghost") {
      playClickSound();
    }
    onClick?.(event);
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      <span className={isChunky ? cn(shiftAmount, "inline-flex items-center justify-center w-full h-full") : ""}>
        {props.children}
      </span>
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
