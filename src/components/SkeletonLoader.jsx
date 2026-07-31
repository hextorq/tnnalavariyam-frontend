import React from 'react'

export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
      style={style}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100/90 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Welcome Header Skeleton */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64 sm:w-96" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 rounded-xl" />
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid Skeleton */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" key={i}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-10 rounded-xl" />
              </div>
              <Skeleton className="mt-4 h-9 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Application Forms Section Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-56" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4" key={i}>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="size-10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Work Queue Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between" key={i}>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Banner Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-64" />
            </div>
          </div>
        </div>

        {/* Section 1 Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="space-y-2" key={i}>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Photo Section Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-slate-200">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="mt-3 h-4 w-40" />
            <Skeleton className="mt-4 h-11 w-40 rounded-xl" />
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function TrackingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-2 h-7 w-64" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="mt-6 h-12 w-40 rounded-xl" />
        </div>

        {/* Flow Stepper Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <Skeleton className="h-4 w-56" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div className="flex flex-col items-center space-y-2 text-center" key={i}>
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 pt-4 border-t border-slate-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="rounded-xl border border-slate-200 p-4 space-y-2" key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />

        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4" key={i}>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-10 w-full rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
