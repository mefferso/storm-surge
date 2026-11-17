# Educator notes and model equations

**Scope.** The coastline is inspired by Grand Isle, Plaquemines Parish, and Lake Borgne. Every elevation, structure, water level and protection threshold is illustrative. The vertical datum is an arbitrary zero near everyday sea level. It is independent of actual tidal or geodetic datums (including NAVD88 and MHHW). The drawing strongly exaggerates relief and compresses distance. The two offshore profiles are schematic near-coast portions of different shelf types, and the track inset is schematic. Storm motion in miles is along a straight track through landfall, while the signed landfall offset refers to the landfall point's location along the coast relative to the community.

## What drives the water?

The category sets a band for maximum sustained wind speed. The model uses the selected speed within that band. The Saffir–Simpson Hurricane Wind Scale is a wind scale. Storm surge also depends on wind-field size, duration and direction, storm track and forward speed, the shelf, and local geography.

The storm forcing is an intentionally simple empirical analogue. For wind `V` (mph), wind-field scale `R` (55, 100, 175 miles), forward speed `U` (8, 15, 25 mph), signed along-coast offset `d` (positive west), and approach angle `a`:

- The normalized track proximity is `exp(−0.33(d/R)²)`. The onshore multiplier combines the cosine of the approach angle with a smooth right/left-side weighting based on offset. It always stays positive in this exercise. True winds can instead cause local setdown.
- The unfettered peak wind forcing in feet is `7.6 × (V/105)² × (R/100)^0.86 × shelf × onshore × proximity`. The shelf multiplier is 1.30 for broad/shallow or 0.67 for narrow/steep. Above 17 ft, the forcing uses a smooth saturation that asymptotically approaches 25 ft. This keeps extreme settings within a useful teaching range. It represents a display-model choice.
- The main forcing follows a Gaussian in hours, centered at `−2.1 + 0.067a + 1.2d/R`. Its width is `clamp(4.2 + 0.46R/U, 4.6, 15)` hours. A shorter, 2.5-hour-wide pulse around −0.6 h scales with forward speed and favorable track geometry. This allows slower forcing to persist longer and gives some fast approaches a higher peak. Neither speed relationship generalizes to every coast or storm.
- A linear adjustment integrates the response, `dW/dt = (forcing − W) / τ`, with a 4.2 h response on the shallow shelf and 2.2 h on the steep profile. A small separate pressure proxy is added, peaking near landfall at `0.8 × V/105 × proximity` feet. The wind-driven anomaly and pressure contribution together produce the modeled surge. Pressure here is a teaching proxy and is not inferred from actual pressures.

The solution steps forward every 0.1 h from a 120-hour spin-up. The app displays −24 to +36 hours. Scrubbing reads the stored result at that time. Peak inundation need not match peak storm surge or landfall. Displayed tenths distinguish nearby levels during classroom comparisons.

## Tides, waves and inundation

- The predicted tide is a 0.95 ft amplitude cosine with a 24.84 h period. Low, mid and high settings shift its phase at landfall. This single, diurnal-like constituent is a teaching approximation. Astronomical tide plus the wind/pressure surge is the lab’s storm tide. The lab reports breaking-wave setup separately using a small wind-exposure proxy (at most 0.43 ft) and adds it to the exterior mean coastal level. Individual crests, spray and a small nearshore uprush are visual cues. The probe excludes instantaneous wave crests and runup and the exhibit cannot calculate their reach.
- Terrain consists of linearly interpolated cross-section points. Exterior water reaches a land cell when the mean coastal level can clear all prior sills. Local flood depth is `max(0, connected water surface − local ground elevation)`. Over-floor depth uses the raised floor in place of ground. The displayed storm-tide and exterior values are heights above model zero, so they can differ markedly from inundation depth.
- The natural ridge crest is 6 ft and the engineered levee crest is 12 ft. Exterior water flows into interior storage only above the crest. Overtopping supply scales with `(coastal water − crest)^1.5` and tapers as the interior fills. Stored water drains on a 16-hour timescale. The barrier stays intact. The interior water number represents a low basin, so buildings at higher elevations can remain dry.
- Rain adds water to a separate storage reservoir with input proportional to the storm’s local weather envelope and drainage proportional to the amount stored. The notional storage ceiling is 1.55 ft. Some rainwater and previously connected coastal water can remain in road depressions after the main coastal surface recedes. Rain never contributes to the storm surge or predicted tide readouts. Flood duration is the total within the modeled timeline with at least 0.1 ft of local flooding, including duration from separate wet periods. Water can outlast the displayed window.

## Operational context

The lab does not solve momentum and continuity over a real grid. It omits actual terrain and bathymetry, channels and lateral pathways, tide–surge interaction, time-varying wind fields, real central pressures, wave transformation and runup calculations, watershed runoff, drainage operations, and structural failures. Its coefficients and water levels are chosen for controlled comparisons across scenarios and should never be interpreted as site-specific predictions or evacuation guidance.

NOAA’s **Sea, Lake, and Overland Surges from Hurricanes (SLOSH)** uses storm winds and pressure and solves equations of motion on computational grids that represent coastal basins. The **NHC Potential Storm Surge Flooding Map** incorporates forecast uncertainty and depicts potential storm-driven inundation above normally dry ground. The mapped level is a reasonable worst-case estimate at each location, with about a 10% chance of being exceeded. The lab’s peak depths are deterministic classroom examples.

- [NOAA Ocean Service — What is storm surge?](https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html)
- [NOAA MDL — Storm Surge FAQ](https://vlab.noaa.gov/web/mdl/faq-storm-surge)
- [NHC — Saffir–Simpson Hurricane Wind Scale](https://www.nhc.noaa.gov/aboutsshws.php)
- [NOAA MDL — SLOSH](https://vlab.noaa.gov/web/mdl/slosh)
- [NHC — Potential Storm Surge Flooding Map](https://www.nhc.noaa.gov/surge/inundation/)
