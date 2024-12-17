export interface Theme {
    name: string;
    logoPath: string;
    registerPageBackground: string;
    loginPageBackground: string;
    homePageBackground?: string;
}

const picsFolder = '/src/lib/assets/';

export const themes: Theme[] = [
    {
        name: 'default',
        logoPath: `${picsFolder}classic/classiclogo.png`,
        registerPageBackground: `${picsFolder}classic/matcha_decor6.png`,
        loginPageBackground: `${picsFolder}classic/matcha_decor10.png`,
        homePageBackground: `${picsFolder}matcha_decor40.png`
    },
    {
        name: 'geek',
        logoPath: `${picsFolder}geek/matcha_logo10.png`,
        registerPageBackground: `${picsFolder}geek/matcha_decor47.png`,
        loginPageBackground: `${picsFolder}geek/matcha_decor43.png`,
        homePageBackground: `${picsFolder}geek/homegeek.png`
    },
    {
        name: 'pop',
        logoPath: `${picsFolder}pop/matcha_logo.png`,
        registerPageBackground: `${picsFolder}pop/matcha_decor15.png`,
        loginPageBackground: `${picsFolder}pop/matcha_decor32.png`,
        homePageBackground: `${picsFolder}pop/homepop.png`
    },
    {
        name: 'artdeco',
        logoPath: `${picsFolder}artdeco/matcha_logo6.png`,
        registerPageBackground: `${picsFolder}artdeco/matcha_decorartdeco.png`,
        loginPageBackground: `${picsFolder}artdeco/matcha_decor28.png`,
        homePageBackground: `${picsFolder}artdeco/home_artdeco.png`
    }
];