import { Link } from "react-router-dom";
import { Zap, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, Heart } from "lucide-react";

const footerLinks = {
  platform: {
    title: "Platform",
    links: [
      { name: "Find Tutors",   href: "/tutors" },
      { name: "Subjects",      href: "/subjects" },
      { name: "Pricing",       href: "/pricing" },
      { name: "How It Works",  href: "/how-it-works" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us",  href: "/about" },
      { name: "Careers",   href: "/careers" },
      { name: "Contact",   href: "/contact" },
      { name: "Blog",      href: "/blog" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "Help Center",     href: "/help" },
      { name: "FAQs",            href: "/faqs" },
      { name: "Terms of Service",href: "/terms" },
      { name: "Privacy Policy",  href: "/privacy" },
    ],
  },
  tutors: {
    title: "For Tutors",
    links: [
      { name: "Become a Tutor",   href: "/signup?role=tutor" },
      { name: "Tutor Guidelines", href: "/tutor-guidelines" },
      { name: "Resources",        href: "/tutor-resources" },
    ],
  },
};

const socialLinks = [
  { icon: Facebook,  href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter,   href: "#", label: "Twitter" },
  { icon: Linkedin,  href: "#", label: "LinkedIn" },
  { icon: Youtube,   href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto container-padding pt-16 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-background">
                Study<span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>pulse</span>
              </span>
            </Link>

            <p className="text-background/65 text-sm leading-relaxed mb-6 max-w-xs">
              Pakistan's smartest tutoring platform. Connecting students with verified expert tutors for every subject, every level.
            </p>

            <div className="space-y-2.5">
              <a href="mailto:hello@studypulse.pk" className="flex items-center gap-3 text-background/65 hover:text-background transition-colors text-sm">
                <Mail className="w-4 h-4 shrink-0" />
                hello@studypulse.pk
              </a>
              <a href="tel:+923001234567" className="flex items-center gap-3 text-background/65 hover:text-background transition-colors text-sm">
                <Phone className="w-4 h-4 shrink-0" />
                +92 300 123 4567
              </a>
              <div className="flex items-center gap-3 text-background/65 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                Karachi, Pakistan
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map(section => (
            <div key={section.title}>
              <h4 className="font-semibold text-background text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50 flex items-center gap-1.5">
            © {new Date().getFullYear()} Studypulse. Made with <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> in Pakistan.
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map(s => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <s.icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
