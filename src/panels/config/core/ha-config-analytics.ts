import "../../../components/ha-settings-row";
import "@material/mwc-formfield/mwc-formfield";
import "../../../components/ha-checkbox";
import "@material/mwc-button/mwc-button";

import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import "../../../components/ha-card";
import { haStyle } from "../../../resources/styles";
import type { HomeAssistant } from "../../../types";
import { HaCheckbox } from "../../../components/ha-checkbox";

const preferences = ["base", "integrations", "statistics"];

@customElement("ha-config-analytics")
class ConfigAnalytics extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @internalProperty() private _error?: string;

  @internalProperty() private _preferences: string[] = [];

  @internalProperty() private _huuid?: string;

  protected render(): TemplateResult {
    if (
      !isComponentLoaded(this.hass, "analytics") ||
      !this.hass.user?.is_admin ||
      !this._huuid
    ) {
      return html``;
    }

    console.log(this._preferences);

    return html`
      <ha-card
        .header=${this.hass.localize(
          "ui.panel.config.core.section.core.analytics.header"
        )}
      >
        <div class="card-content">
          ${this._error ? html`<div class="error">${this._error}</div>` : ""}
          <p>
            ${this.hass.localize(
              "ui.panel.config.core.section.core.analytics.introduction"
            )}
          </p>
          <p>
            ${this.hass.localize(
              "ui.panel.config.core.section.core.analytics.instance_id",
              "uuid",
              this._huuid
            )}
          </p>
          ${preferences.map((preference) =>
            preference === "base" || this._preferences.includes("base")
              ? html`<ha-settings-row>
                  <span slot="prefix">
                    <ha-checkbox
                      @change=${this._handleRowCheckboxClick}
                      .checked=${this._preferences.includes(preference)}
                      .preference=${preference}
                    >
                    </ha-checkbox>
                  </span>
                  <span slot="heading">
                    ${this.hass.localize(
                      `ui.panel.config.core.section.core.analytics.preference.${preference}.title`
                    )}
                  </span>
                  <span slot="description">
                    ${this.hass.localize(
                      `ui.panel.config.core.section.core.analytics.preference.${preference}.description`
                    )}
                  </span>
                </ha-settings-row>`
              : ""
          )}
          <p>
            ${this.hass.localize(
              "ui.panel.config.core.section.core.analytics.documentation",
              "link",
              html`<a href="#"
                >https://www.home-assistant.io/integrations/analytics</a
              >`
            )}
          </p>
        </div>
        <div class="card-actions">
          <mwc-button @click=${this._save} .disabled=${false}>
            ${this.hass.localize(
              "ui.panel.config.core.section.core.core_config.save_button"
            )}
          </mwc-button>
        </div>
      </ha-card>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (isComponentLoaded(this.hass, "analytics")) {
      this._load();
    }
  }

  private _handleRowCheckboxClick(ev: Event) {
    const checkbox = ev.currentTarget as HaCheckbox;
    const preference = (checkbox as any).preference;

    if (checkbox.checked) {
      if (this._preferences.includes(preference)) {
        return;
      }
      this._preferences = [...this._preferences, preference];
    } else {
      this._preferences = this._preferences.filter(
        (entry) => entry !== preference
      );
    }
  }

  private async _load() {
    const analytics: any = await this.hass.callWS({ type: "analytics" });
    this._huuid = analytics.huuid;
    this._preferences = analytics.preferences;
  }

  private async _save() {
    this._error = undefined;
    try {
      await this.hass.callWS({
        type: "analytics/preferences",
        preferences: this._preferences.includes("base")
          ? this._preferences
          : [],
      });
    } catch (err) {
      this._error = err.message || err;
    }
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        .error {
          color: var(--error-color);
        }

        ha-settings-row {
          padding: 0;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-analytics": ConfigAnalytics;
  }
}
