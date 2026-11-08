<?php
/*
 * CUSTOM KEYCHAIN OPTIONS - must match the options in js/custom.js.
 * The server re-calculates the estimated price so it cannot be changed in the browser.
 */

declare(strict_types=1);

const CUSTOM_MAX_KEYCHAINS = 2;
const CUSTOM_NOTE_LIMIT = 500;
const CUSTOM_SPECIAL_NOTE_LIMIT = 1000;

const CUSTOM_GENDERS = ['Male' => 38, 'Female' => 40];
const CUSTOM_SKIN_TONES = ['Light', 'Fair', 'Medium', 'Tan'];

const CUSTOM_HAIR = [
    'Standard Hijab'       => 0,
    'Short Hair'           => 0,
    'Long Hair'            => 0,
    'Curly / Wavy Hair'    => 5,
    'Custom Detailed Hair' => 5,
];

const CUSTOM_OUTFITS = [
    'Casual Outfit'           => 0,
    'Military / Army'         => 8,
    'General Uniform'         => 8,
    'Baju Melayu Traditional' => 8,
    'Formal Suits'            => 8,
    'Dress'                   => 8,
];

const CUSTOM_ACCESSORIES = [
    'Cap / Helmet or Head Accessories' => 8,
    'Eyeglasses'                       => 3,
    'Backpack / Bag'                   => 5,
    'Graduation Robe'                  => 8,
    'Other Details'                    => 5,
];

/**
 * Checks the keychain choices sent from custom.html.
 * Returns [cleanKeychains, estimatedTotal] or stops with a 422 error.
 */
function validate_custom_keychains(mixed $keychains): array
{
    if (!is_array($keychains) || !array_is_list($keychains) || count($keychains) < 1 || count($keychains) > CUSTOM_MAX_KEYCHAINS) {
        json_error('Please design at least one keychain.', 422);
    }

    $clean = [];
    $total = 0.0;

    foreach ($keychains as $index => $item) {
        $label = 'Keychain #' . ($index + 1);

        if (!is_array($item)) {
            json_error($label . ': invalid choices.', 422);
        }

        $gender = clean_text($item['gender'] ?? '');
        $skin = clean_text($item['skin'] ?? '');
        $hair = clean_text($item['hair'] ?? '');
        $outfit = clean_text($item['outfit'] ?? '');

        if (!array_key_exists($gender, CUSTOM_GENDERS)) {
            json_error($label . ': please choose Male or Female.', 422);
        }
        if (!in_array($skin, CUSTOM_SKIN_TONES, true)) {
            json_error($label . ': please choose a skin tone.', 422);
        }
        if (!array_key_exists($hair, CUSTOM_HAIR) || ($gender === 'Male' && $hair === 'Standard Hijab')) {
            json_error($label . ': please choose a hairstyle.', 422);
        }
        if (!array_key_exists($outfit, CUSTOM_OUTFITS)) {
            json_error($label . ': please choose an outfit.', 422);
        }

        $accessories = $item['accessories'] ?? [];
        if (!is_array($accessories)) {
            json_error($label . ': invalid accessories.', 422);
        }
        $accessories = array_values(array_unique(array_map('clean_text', $accessories)));
        foreach ($accessories as $accessory) {
            if (!array_key_exists($accessory, CUSTOM_ACCESSORIES)) {
                json_error($label . ': unknown accessory selected.', 422);
            }
        }

        $notes = [];
        foreach (['hairNote', 'outfitNote', 'accessoryNote'] as $noteField) {
            $notes[$noteField] = clean_text($item[$noteField] ?? '');
            if (text_length($notes[$noteField]) > CUSTOM_NOTE_LIMIT) {
                json_error($label . ': notes must be ' . CUSTOM_NOTE_LIMIT . ' characters or fewer.', 422);
            }
        }

        $itemTotal = CUSTOM_GENDERS[$gender] + CUSTOM_HAIR[$hair] + CUSTOM_OUTFITS[$outfit];
        foreach ($accessories as $accessory) {
            $itemTotal += CUSTOM_ACCESSORIES[$accessory];
        }

        $clean[] = [
            'gender'      => $gender,
            'basePrice'   => CUSTOM_GENDERS[$gender],
            'skin'        => $skin,
            'hair'        => $hair,
            'outfit'      => $outfit,
            'accessories' => $accessories,
            'itemTotal'   => (float) $itemTotal,
        ] + $notes;

        $total += $itemTotal;
    }

    return [$clean, round($total, 2)];
}

/** Builds the WhatsApp chat link with the full custom order details. */
function custom_order_whatsapp_url(int $orderId, array $customer, array $keychains, string $specialNotes, float $estimatedTotal): string
{
    $lines = [
        "Hello Sa'adatul D.I.Y! I would like to discuss my custom order.",
        '',
        '*Custom Order #' . $orderId . '*',
        'Name: ' . $customer['full_name'],
        'Email: ' . $customer['email'],
    ];

    if (!empty($customer['phone'])) {
        $lines[] = 'Phone: ' . $customer['phone'];
    }

    foreach ($keychains as $index => $item) {
        $lines[] = '';
        $lines[] = '*Keychain #' . ($index + 1) . ' (' . $item['gender'] . ')*';
        $lines[] = '- Skin tone: ' . $item['skin'];
        $lines[] = '- Hair: ' . $item['hair'] . ($item['hairNote'] !== '' ? ' (' . $item['hairNote'] . ')' : '');
        $lines[] = '- Outfit: ' . $item['outfit'] . ($item['outfitNote'] !== '' ? ' (' . $item['outfitNote'] . ')' : '');
        $lines[] = '- Accessories: ' . ($item['accessories'] ? implode(', ', $item['accessories']) : 'None')
            . ($item['accessoryNote'] !== '' ? ' (' . $item['accessoryNote'] . ')' : '');
        $lines[] = '- Item estimate: BND $' . money((float) $item['itemTotal']);
    }

    if ($specialNotes !== '') {
        $lines[] = '';
        $lines[] = 'Special notes: ' . $specialNotes;
    }

    $lines[] = '';
    $lines[] = 'Estimated total: BND $' . money($estimatedTotal);
    $lines[] = 'I understand the final price will be confirmed with you here on WhatsApp.';

    return 'https://wa.me/' . WHATSAPP_NUMBER . '?text=' . rawurlencode(implode("\n", $lines));
}
