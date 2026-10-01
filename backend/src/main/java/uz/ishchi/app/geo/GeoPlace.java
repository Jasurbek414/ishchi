package uz.ishchi.app.geo;

/**
 * A place found by address search or by reverse lookup: {@code name} is the short line shown in
 * bold (street and house, or the place's own name), {@code address} the area it is in.
 */
public record GeoPlace(String name, String address, double latitude, double longitude) {
}
