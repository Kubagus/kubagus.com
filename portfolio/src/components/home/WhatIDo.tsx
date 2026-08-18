import { useTranslation } from "react-i18next";
import { Cpu, Database, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Service {
  title: string;
  desc: string;
  icon: LucideIcon;
}

export function WhatIDo() {
  const { t } = useTranslation();

  const services: Service[] = [
    { title: t("home.services.software.title"), desc: t("home.services.software.desc"), icon: Cpu },
    { title: t("home.services.architecture.title"), desc: t("home.services.architecture.desc"), icon: Database },
    { title: t("home.services.optimization.title"), desc: t("home.services.optimization.desc"), icon: TrendingUp },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
        {t("home.whatIDo")}
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <Card key={service.title} className="transition-colors hover:border-primary/50">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <service.icon className="size-6" />
              </span>
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="text-sm text-muted-foreground">{service.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}