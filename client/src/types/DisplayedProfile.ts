export class DisplayedProfile {
    id: number;
    username: string;
    userData: User;
    date_of_birth: Date;
    biography: string;
    fame_rating: number;
    first_name: string;
    last_name: string;
    last_active: Date;
    sexualPref: 'heterosexual' | 'bisexual' | 'homosexual';
    gender: string;

    constructor(
        id: number,
        username: string,
        userData: User,
        date_of_birth: Date,
        biography: string,
        fame_rating: number,
        first_name: string,
        last_name: string,
        last_active: Date,
        sexualPref: 'heterosexual' | 'bisexual' | 'homosexual';,
        gender: string) {
        this.id = id;
        this.username = username;
        this.userData = userData;
        this.date_of_birth = date_of_birth;

        this.biography = biography;
            
        this.fame_rating = fame_rating;
        this.first_name = first_name;

        this.last_name = last_name;
        this.last_active = last_active;
        this.sexualPref = sexualPref;
        this.gender = gender;
}
