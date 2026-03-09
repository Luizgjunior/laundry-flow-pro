import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Camera, CheckCircle2, ClipboardCheck, FileCheck, Layers, MessageSquare, Package,
  QrCode, Search, Shield, Smartphone, Sparkles, Truck, Play
} from "lucide-react";

const features = [
  { icon: Camera, title: "Fotos de entrada", description: "Documente cada peça com fotos de alta qualidade na chegada" },
  { icon: Search, title: "Triagem inteligente", description: "Mapeie manchas na silhueta interativa com cálculo de risco" },
  { icon: MessageSquare, title: "Aprovação digital", description: "Envie link pelo WhatsApp para o cliente aprovar com um clique" },
  { icon: Shield, title: "Blindagem jurídica", description: "IP, geolocalização e timestamp registrados na aprovação" },
  { icon: ClipboardCheck, title: "Inspeção de qualidade", description: "Checklist completo com comparativo antes e depois" },
  { icon: QrCode, title: "Rastreabilidade QR", description: "Cada peça tem QR Code para rastreamento em tempo real" },
];

const howItWorks = [
  { step: "1", title: "Entrada", description: "Registre a peça, tire fotos e faça o diagnóstico de manchas" },
  { step: "2", title: "Tratamento", description: "Monte o plano técnico, aprove com o cliente e execute" },
  { step: "3", title: "Entrega", description: "Inspecione, notifique o cliente e registre a entrega com assinatura" },
];

const plans = [
  { name: "Gratuito", price: "0", features: ["1 usuário", "30 peças/mês", "100MB storage"], highlight: false },
  { name: "Profissional", price: "197", features: ["10 usuários", "Peças ilimitadas", "2GB storage", "Relatórios", "WhatsApp auto"], highlight: true },
  { name: "Enterprise", price: "497", features: ["50 usuários", "Peças ilimitadas", "10GB storage", "API", "White-label", "Suporte dedicado"], highlight: false },
];

const faqs = [
  { q: "Preciso instalar algo?", a: "Não! O TextArea funciona no navegador. Você também pode instalar como app na tela inicial do celular." },
  { q: "Como funciona a aprovação pelo WhatsApp?", a: "Após o diagnóstico, o sistema gera um link único. Você envia pelo WhatsApp e o cliente aprova com um clique. Tudo registrado com IP e horário." },
  { q: "Posso usar em várias unidades?", a: "Sim! Cada unidade é um tenant separado com seus próprios dados e configurações." },
  { q: "O sistema funciona offline?", a: "Para a maioria das funcionalidades é necessário internet. O app mostra uma página offline amigável quando sem conexão." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">T</span>
            </div>
            <span className="font-bold text-foreground text-lg">TexTrace</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Entrar</Button>
            <Button size="sm" onClick={() => navigate("/login")}>Começar grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Badge variant="secondary" className="mb-6 text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Aprovação digital pelo WhatsApp
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Gestão completa para sua{" "}
            <span className="text-primary">lavanderia premium</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Rastreabilidade total, aprovação digital do cliente e blindagem jurídica.
            Tudo em um sistema mobile-first feito para sua equipe.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="text-base px-8" onClick={() => navigate("/login")}>
              Começar gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Sem cartão de crédito • 30 peças grátis por mês</p>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Tudo que você precisa</h2>
            <p className="mt-2 text-muted-foreground">Do balcão à entrega, cada etapa documentada</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Como funciona</h2>
            <p className="mt-2 text-muted-foreground">9 etapas automatizadas do balcão à entrega</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Preços simples e transparentes</h2>
            <p className="mt-2 text-muted-foreground">Comece grátis, faça upgrade quando precisar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.highlight ? "border-primary border-2 relative" : ""}>
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-foreground">
                    R$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.highlight ? "default" : "outline"} onClick={() => navigate("/login")}>
                    Selecionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Perguntas frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Pronto para modernizar sua lavanderia?</h2>
          <p className="mt-4 text-primary-foreground/80">Comece grátis hoje mesmo. Sem cartão de crédito.</p>
          <Button size="lg" variant="secondary" className="mt-8 text-base px-8" onClick={() => navigate("/login")}>
            Criar conta gratuita <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © 2026 TexTrace. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
