import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export const CategoryCard = ({ title, image, to, description }) => (
    <Link
        to={to}
        className="relative overflow-hidden group block"
        style={{ borderRadius: 18, aspectRatio: "3 / 4" }}
        data-testid={`category-card-${to.split("/").pop()}`}
    >
        <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div
            className="absolute inset-0"
            style={{
                background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(44,40,37,0.55) 100%)",
            }}
        />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
                <h3 className="font-serif text-2xl md:text-3xl text-white leading-tight">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-white/85 mt-1 max-w-[240px]">
                        {description}
                    </p>
                )}
            </div>
            <span
                className="p-2 rounded-full"
                style={{ background: "rgba(249,248,246,0.9)", color: "var(--aure-ink)" }}
            >
                <ArrowUpRight size={16} />
            </span>
        </div>
    </Link>
);
