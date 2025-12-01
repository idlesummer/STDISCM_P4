import * as React from "react";
import { cn } from "@/lib/utils";

// h1
export function TypographyH1(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      {...props}
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        props.className
      )}
    />
  );
}

// h2
export function TypographyH2(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        props.className
      )}
    />
  );
}

// h3
export function TypographyH3(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        props.className
      )}
    />
  );
}

// h4
export function TypographyH4(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      {...props}
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        props.className
      )}
    />
  );
}

// p
export function TypographyP(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn(
        "leading-7 [&:not(:first-child)]:mt-6",
        props.className
      )}
    />
  );
}

// blockquote
export function TypographyBlockquote(
  props: React.HTMLAttributes<HTMLQuoteElement>
) {
  return (
    <blockquote
      {...props}
      className={cn(
        "mt-6 border-l-2 pl-6 italic",
        props.className
      )}
    />
  );
}

// inline code
export function TypographyInlineCode(
  props: React.HTMLAttributes<HTMLElement>
) {
  return (
    <code
      {...props}
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        props.className
      )}
    />
  );
}

// list
export function TypographyList(
  props: React.HTMLAttributes<HTMLUListElement>
) {
  return (
    <ul
      {...props}
      className={cn(
        "my-6 ml-6 list-disc [&>li]:mt-2",
        props.className
      )}
    />
  );
}

// table
export function TypographyTable(
  props: React.TableHTMLAttributes<HTMLTableElement>
) {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table
        {...props}
        className={cn("w-full", props.className)}
      />
    </div>
  );
}

// lead
export function TypographyLead(
  props: React.HTMLAttributes<HTMLParagraphElement>
) {
  return (
    <p
      {...props}
      className={cn(
        "text-muted-foreground text-xl",
        props.className
      )}
    />
  );
}

// large
export function TypographyLarge(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return (
    <div
      {...props}
      className={cn(
        "text-lg font-semibold",
        props.className
      )}
    />
  );
}

// small
export function TypographySmall(
  props: React.HTMLAttributes<HTMLElement>
) {
  return (
    <small
      {...props}
      className={cn(
        "text-sm font-medium leading-none",
        props.className
      )}
    />
  );
}

// muted
export function TypographyMuted(
  props: React.HTMLAttributes<HTMLParagraphElement>
) {
  return (
    <p
      {...props}
      className={cn(
        "text-muted-foreground text-sm",
        props.className
      )}
    />
  );
}
