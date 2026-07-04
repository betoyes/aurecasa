import React from "react";

export const AnnouncementBar = () => (
    <div
        className="w-full py-2 text-center"
        style={{ background: "#2C2825", color: "#F9F8F6" }}
        data-testid="announcement-bar"
    >
        <span className="ui-label" style={{ color: "#F9F8F6", opacity: 0.9 }}>
            Produção sob demanda &nbsp;·&nbsp; Frete para todo o Brasil
        </span>
    </div>
);
